import type { AssetSearchResult } from "@/domain/asset";
import { extractItems, isNasaSearchResponse, parseNasaRawItem } from "./raw-types";
import { normalizeNasaItem } from "./normalize";

const NASA_API_URL = "https://images-api.nasa.gov/search";
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60 * 60; // 1h — this endpoint publishes no numeric rate limit; cache conservatively

export interface NasaSearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class NasaUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw `/search` response body. Split out
 * from fetchNasaAssets so "malformed/non-image entries get skipped, not
 * thrown" is unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): NasaSearchResult {
  if (!isNasaSearchResponse(json)) {
    throw new NasaUpstreamError("NASA Image Library returned an unexpected response shape.");
  }

  const entries = extractItems(json);
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of entries) {
    try {
      const raw = parseNasaRawItem(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizeNasaItem(raw));
    } catch {
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: searches NASA's Image and Video Library for one query,
 * restricted to media_type=image (cached via Next's fetch Data Cache for
 * ~1h). Confirmed live: this specific endpoint (images-api.nasa.gov) needs
 * no API key at all — distinct from the separate DEMO_KEY-gated
 * api.nasa.gov platform (APOD, Mars Photos, etc.), which this app does not
 * use.
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/nasa route instead, never to NASA
 * directly.
 */
export async function fetchNasaAssets(query: string): Promise<NasaSearchResult> {
  const url = new URL(NASA_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("media_type", "image");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new NasaUpstreamError(`NASA Image Library request ${reason}.`);
  }

  if (!response.ok) {
    throw new NasaUpstreamError(`NASA Image Library responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new NasaUpstreamError("NASA Image Library returned a response we couldn't parse.");
  }

  return parseAndNormalizeSearch(json);
}
