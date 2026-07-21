import type { AssetSearchResult } from "@/domain/asset";
import { isPolyHavenAssetsResponse, parsePolyHavenRawAsset } from "./raw-types";
import { normalizePolyHavenAsset } from "./normalize";

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
 * drops oversized entries rather than storing them).
 *
 * The raw response is never handed to Next's cache at all here — instead,
 * the small, already-parsed/normalized PolyHavenCatalogResult (a few
 * hundred KB of plain objects, not a 3MB raw JSON blob) is cached in a
 * simple process-local variable. This is a real, working, zero-cost cache
 * (no external service, no database) sized to what this app actually
 * needs: a single always-on Node server (`next dev` / `next start`), not a
 * multi-instance serverless deployment where an in-memory cache wouldn't
 * be shared across instances anyway.
 */
let cachedCatalog: { readonly result: PolyHavenCatalogResult; readonly fetchedAt: number } | null = null;
let inflightCatalog: Promise<PolyHavenCatalogResult> | null = null;

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
 * normalizes it. Never called directly by app code; only through
 * fetchPolyHavenCatalog, which wraps it with the in-memory cache.
 */
async function fetchFreshCatalog(): Promise<PolyHavenCatalogResult> {
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
 * Server-only: returns Poly Haven's full asset catalog, cached in-process
 * for ~6h (see the module-level comment above for why this is a plain
 * variable rather than Next's fetch Data Cache). Concurrent callers during
 * a cache miss share a single in-flight request rather than each triggering
 * their own ~3MB fetch from Poly Haven.
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/polyhaven route instead, never to Poly
 * Haven directly.
 */
export async function fetchPolyHavenCatalog(): Promise<PolyHavenCatalogResult> {
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

/** Test-only escape hatch — resets the in-memory cache so each test starts clean. Never called by app runtime code. */
export function resetPolyHavenCatalogCacheForTests(): void {
  cachedCatalog = null;
  inflightCatalog = null;
}
