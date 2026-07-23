import type { AssetSearchResult } from "@/domain/asset";
import { extractPages, isWikimediaQueryResponse, parseWikimediaRawPage } from "./raw-types";
import { normalizeWikimediaPage } from "./normalize";

const WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php";
// Wikimedia's API:Etiquette (mediawiki.org/wiki/API:Etiquette) asks for a
// descriptive User-Agent identifying the application and a contact point —
// generic/unidentified clients are throttled more aggressively.
const USER_AGENT = "AssetScoutAI/1.0 (https://asset-scout-ai.vercel.app; game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60 * 60; // 1h — no published numeric rate limit, cache conservatively per API:Etiquette
const RESULT_LIMIT = 24;
const THUMBNAIL_WIDTH = 512;

export interface WikimediaSearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class WikimediaUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw MediaWiki API response body. Split
 * out from fetchWikimediaAssets so "malformed entries get skipped, not
 * thrown" is unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): WikimediaSearchResult {
  if (!isWikimediaQueryResponse(json)) {
    throw new WikimediaUpstreamError("Wikimedia Commons returned an unexpected response shape.");
  }

  const entries = extractPages(json);
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of entries) {
    try {
      const raw = parseWikimediaRawPage(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizeWikimediaPage(raw));
    } catch {
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: searches Wikimedia Commons' File namespace for one query
 * (cached via Next's fetch Data Cache for ~1h per distinct query). Restricted
 * to `filetype:bitmap|drawing` so results are actual displayable images, not
 * audio/video/PDF/category pages. No key required — confirmed by calling the
 * live endpoint directly (2026-07).
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/wikimedia route instead, never to
 * Wikimedia Commons directly.
 */
export async function fetchWikimediaAssets(query: string, limit = RESULT_LIMIT): Promise<WikimediaSearchResult> {
  const url = new URL(WIKIMEDIA_API_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${query} filetype:bitmap|drawing`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(limit));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|size");
  url.searchParams.set("iiurlwidth", String(THUMBNAIL_WIDTH));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new WikimediaUpstreamError(`Wikimedia Commons request ${reason}.`);
  }

  if (!response.ok) {
    throw new WikimediaUpstreamError(`Wikimedia Commons responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new WikimediaUpstreamError("Wikimedia Commons returned a response we couldn't parse.");
  }

  // A query with zero matches omits `query` (sometimes even the whole `query`
  // object, e.g. a bare `{"batchcomplete":true}` — verified live) rather than
  // returning an empty pages array — a normal "no results" case, not an
  // error, so it's checked before the strict isWikimediaQueryResponse gate.
  if (!isWikimediaQueryResponse(json)) {
    return { assets: [], totalUpstream: 0, skipped: 0 };
  }

  return parseAndNormalizeSearch(json);
}
