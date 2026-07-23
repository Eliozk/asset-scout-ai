import type { AssetSearchResult } from "@/domain/asset";
import { isAmbientCGSearchResponse, parseAmbientCGRawAsset } from "./raw-types";
import { normalizeAmbientCGAsset } from "./normalize";

const AMBIENTCG_API_URL = "https://ambientcg.com/api/v2/full_json";
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60 * 60; // 1h — ambientCG documents no rate limit but explicitly isn't "enterprise-grade"; cache conservatively
const RESULT_LIMIT = 30;

export interface AmbientCGSearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class AmbientCGUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw `/api/v2/full_json` response body.
 * Split out from fetchAmbientCGAssets so "malformed/unsupported entries get
 * skipped, not thrown" is unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): AmbientCGSearchResult {
  if (!isAmbientCGSearchResponse(json)) {
    throw new AmbientCGUpstreamError("ambientCG returned an unexpected response shape.");
  }

  const entries = json.foundAssets as readonly unknown[];
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of entries) {
    try {
      const raw = parseAmbientCGRawAsset(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizeAmbientCGAsset(raw));
    } catch {
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: searches ambientCG's public catalog for one query (cached via
 * Next's fetch Data Cache for ~1h per distinct query). No `type` filter is
 * sent — ambientCG's own type filter was confirmed live to silently no-op
 * for values with zero current matches instead of returning zero results
 * (see raw-types.ts's doc comment), so filtering to Material/HDRI happens
 * entirely client-side (parseAmbientCGRawAsset) against the real per-asset
 * dataType field instead.
 *
 * ambientCG's search is publicly accessible with no key at all — confirmed
 * by calling the live endpoint directly (2026-07).
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/ambientcg route instead, never to
 * ambientCG directly.
 */
export async function fetchAmbientCGAssets(query: string, limit = RESULT_LIMIT): Promise<AmbientCGSearchResult> {
  const url = new URL(AMBIENTCG_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "Popular");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("include", "imageData");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new AmbientCGUpstreamError(`ambientCG request ${reason}.`);
  }

  if (!response.ok) {
    throw new AmbientCGUpstreamError(`ambientCG responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AmbientCGUpstreamError("ambientCG returned a response we couldn't parse.");
  }

  return parseAndNormalizeSearch(json);
}
