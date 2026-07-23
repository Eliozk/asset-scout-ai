import type { AssetSearchResult } from "@/domain/asset";
import { isOpenverseSearchResponse, parseOpenverseRawResult } from "./raw-types";
import { normalizeOpenverseResult } from "./normalize";

const OPENVERSE_API_URL = "https://api.openverse.org/v1/images/";
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60 * 60; // 1h — anonymous access is throttled harder than authenticated; cache conservatively
// Confirmed live: anonymous (unauthenticated) Openverse requests reject any
// page_size above 20 with a 401 ("page_size may not exceed 20 for anonymous
// requests") — this app runs fully anonymously (see fetchOpenverseAssets's
// doc comment), so 20 is a hard ceiling, not just a preference.
const PAGE_SIZE = 20;

export interface OpenverseSearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class OpenverseUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw `/v1/images/` response body. Split
 * out from fetchOpenverseAssets so "malformed/mature entries get skipped,
 * not thrown" is unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): OpenverseSearchResult {
  if (!isOpenverseSearchResponse(json)) {
    throw new OpenverseUpstreamError("Openverse returned an unexpected response shape.");
  }

  const entries = json.results as readonly unknown[];
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of entries) {
    try {
      const raw = parseOpenverseRawResult(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizeOpenverseResult(raw));
    } catch {
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: searches Openverse's public image catalog for one query
 * (cached via Next's fetch Data Cache for ~1h per distinct query). Runs
 * fully anonymously — no OPENVERSE_CLIENT_ID/SECRET is read or required;
 * Openverse's own docs confirm anonymous access works, just with a lower
 * throttling tier than a registered OAuth2 client (a possible future
 * enhancement, not implemented here — see README roadmap).
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/openverse route instead, never to
 * Openverse directly.
 */
export async function fetchOpenverseAssets(query: string): Promise<OpenverseSearchResult> {
  const url = new URL(OPENVERSE_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("mature", "false");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new OpenverseUpstreamError(`Openverse request ${reason}.`);
  }

  if (response.status === 429) {
    throw new OpenverseUpstreamError("Openverse rate limit reached — try again shortly.");
  }
  if (!response.ok) {
    throw new OpenverseUpstreamError(`Openverse responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new OpenverseUpstreamError("Openverse returned a response we couldn't parse.");
  }

  return parseAndNormalizeSearch(json);
}
