import type { AssetSearchResult } from "@/domain/asset";
import { isPolyHavenAssetsResponse, parsePolyHavenRawAsset } from "./raw-types";
import { normalizePolyHavenAsset } from "./normalize";

const POLY_HAVEN_ASSETS_URL = "https://api.polyhaven.com/assets";

/** Required by Poly Haven's Terms of Service: every request must send an identifying User-Agent. */
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";

const UPSTREAM_TIMEOUT_MS = 10_000;
const REVALIDATE_SECONDS = 6 * 60 * 60; // ~6 hours

export interface PolyHavenCatalogResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class PolyHavenUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw `/assets` response body. Split out
 * from fetchPolyHavenCatalog so "malformed entries get skipped, not thrown"
 * is unit-testable without touching the network.
 */
export function parseAndNormalizeCatalog(json: unknown): PolyHavenCatalogResult {
  if (!isPolyHavenAssetsResponse(json)) {
    throw new PolyHavenUpstreamError("Poly Haven returned an unexpected response shape.");
  }

  const entries = Object.entries(json);
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const [slug, rawValue] of entries) {
    try {
      const raw = parsePolyHavenRawAsset(rawValue);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizePolyHavenAsset(slug, raw));
    } catch {
      // Never let one malformed/unexpected entry take down the whole catalog.
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: fetches Poly Haven's full asset catalog once (cached via
 * Next's fetch Data Cache for ~6h) and delegates to parseAndNormalizeCatalog.
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/polyhaven route instead, never to Poly
 * Haven directly.
 */
export async function fetchPolyHavenCatalog(): Promise<PolyHavenCatalogResult> {
  let response: Response;
  try {
    response = await fetch(POLY_HAVEN_ASSETS_URL, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new PolyHavenUpstreamError(`Poly Haven request ${reason}.`);
  }

  if (!response.ok) {
    throw new PolyHavenUpstreamError(`Poly Haven responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new PolyHavenUpstreamError("Poly Haven returned a response we couldn't parse.");
  }

  return parseAndNormalizeCatalog(json);
}
