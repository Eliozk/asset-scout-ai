import type { AssetSearchResult } from "@/domain/asset";
import { isPolyHavenAssetsResponse, parsePolyHavenRawAsset } from "./raw-types";
import { normalizePolyHavenAsset } from "./normalize";
import { isValidPolyHavenCatalogManifest, validatePolyHavenCatalog } from "./catalog-schema";
import type { PolyHavenCatalogManifest } from "./catalog-schema";
import rawStaticCatalog from "@/data/polyhaven-catalog/catalog.json";
import rawStaticManifest from "@/data/polyhaven-catalog/manifest.json";

const POLY_HAVEN_ASSETS_URL = "https://api.polyhaven.com/assets";

/** Required by Poly Haven's Terms of Service: every request must send an identifying User-Agent. */
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";

const UPSTREAM_TIMEOUT_MS = 10_000;
const REVALIDATE_MS = 6 * 60 * 60 * 1000; // ~6 hours

export interface PolyHavenCatalogResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class PolyHavenUpstreamError extends Error {}

/**
 * Poly Haven's full `/assets` catalog is a single ~3MB JSON response —
 * comfortably over Next.js's fetch Data Cache's hard 2MB-per-entry limit
 * (passing `next: { revalidate }` on this fetch logs "Failed to set
 * Next.js data cache ... items over 2MB can not be cached" on every single
 * request and silently never actually caches anything, since Next just
 * drops oversized entries rather than storing them). It's also too large a
 * fetch+parse to safely repeat on every cold serverless invocation — a
 * previous version of this module cached the parsed result in a plain
 * process-local variable, which works for a single always-on Node process
 * (`next dev` / `next start`) but provides little benefit on Vercel: a
 * multi-instance/cold-start serverless deployment has no shared memory
 * between invocations, so that cache could still mean a live ~3MB Poly
 * Haven fetch on every request, risking the function's execution time
 * limit.
 *
 * Fixed (Milestone 5 Phase 2) by committing a versioned static snapshot —
 * see scripts/generate-polyhaven-catalog.mts and README's "Catalog &
 * embeddings refresh" section — and serving THAT in the normal case: zero
 * network calls, zero parse cost, at request time. The in-memory cache
 * below still exists, but now only as an honest fallback for the
 * unexpected case where the static catalog is missing or fails validation.
 */
const staticCatalog = validatePolyHavenCatalog(rawStaticCatalog);
const staticManifest = isValidPolyHavenCatalogManifest(rawStaticManifest) ? rawStaticManifest : null;

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
 * Fetches Poly Haven's `/assets` catalog fresh from the network (no Next.js
 * fetch-cache options — see the module-level comment above for why) and
 * normalizes it. In normal production requests this is never called at all
 * (see fetchPolyHavenCatalog below, which prefers the committed static
 * catalog) — it's exported for two callers only: the generation script
 * (scripts/generate-polyhaven-catalog.mts), and as an honest live fallback
 * if the static catalog is ever missing or fails validation.
 */
export async function fetchFreshCatalog(): Promise<PolyHavenCatalogResult> {
  let response: Response;
  try {
    response = await fetch(POLY_HAVEN_ASSETS_URL, {
      headers: { "User-Agent": USER_AGENT },
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

/**
 * Builds a fetchPolyHavenCatalog function bound to a specific static
 * catalog + manifest, each with its own independent in-memory
 * live-fallback cache. Factored out (same pattern as
 * lib/providers/kenney/provider.ts's createKenneyCatalogSearchProvider) so
 * tests can exercise the live-fetch-fallback path in isolation — by
 * constructing a loader with an empty static catalog — without depending on
 * or mutating the real committed data/polyhaven-catalog files.
 *
 * Prefers the given static snapshot (instant, zero network, safe on every
 * serverless invocation) and only falls back to a live fetch — cached
 * in-process for ~6h, concurrent callers sharing one in-flight request — if
 * that static catalog is empty, so a deployment that somehow shipped
 * without it still degrades to working (if slower) behavior instead of an
 * empty Poly Haven source.
 */
export function createPolyHavenCatalogLoader(
  catalog: readonly AssetSearchResult[],
  manifest: PolyHavenCatalogManifest | null,
): {
  fetchCatalog: () => Promise<PolyHavenCatalogResult>;
  resetCacheForTests: () => void;
} {
  let cachedCatalog: { readonly result: PolyHavenCatalogResult; readonly fetchedAt: number } | null = null;
  let inflightCatalog: Promise<PolyHavenCatalogResult> | null = null;

  async function fetchCatalog(): Promise<PolyHavenCatalogResult> {
    if (catalog.length > 0) {
      return {
        assets: catalog,
        totalUpstream: manifest?.totalUpstream ?? catalog.length,
        skipped: manifest?.skipped ?? 0,
      };
    }

    if (cachedCatalog && Date.now() - cachedCatalog.fetchedAt < REVALIDATE_MS) {
      return cachedCatalog.result;
    }

    if (inflightCatalog) return inflightCatalog;

    inflightCatalog = fetchFreshCatalog()
      .then((result) => {
        cachedCatalog = { result, fetchedAt: Date.now() };
        return result;
      })
      .finally(() => {
        inflightCatalog = null;
      });

    return inflightCatalog;
  }

  function resetCacheForTests(): void {
    cachedCatalog = null;
    inflightCatalog = null;
  }

  return { fetchCatalog, resetCacheForTests };
}

const productionLoader = createPolyHavenCatalogLoader(staticCatalog, staticManifest);

/**
 * Server-only: returns Poly Haven's full asset catalog — see
 * createPolyHavenCatalogLoader for the static-preferred/live-fallback
 * strategy. This module must only be imported from the Route Handler —
 * client code talks to our own /api/providers/polyhaven route instead,
 * never to Poly Haven directly.
 */
export const fetchPolyHavenCatalog = productionLoader.fetchCatalog;

/** Test-only escape hatch — resets the in-memory cache so each test starts clean. Never called by app runtime code. */
export const resetPolyHavenCatalogCacheForTests = productionLoader.resetCacheForTests;
