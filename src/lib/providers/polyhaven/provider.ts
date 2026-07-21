import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { filterAssets } from "@/lib/search/filter";
import { sortAssets } from "@/lib/search/sort";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // mirrors the server route's ~6h revalidation window

interface Cache {
  readonly assets: readonly AssetSearchResult[];
  readonly fetchedAt: number;
}

let cache: Cache | null = null;
let inflight: Promise<readonly AssetSearchResult[]> | null = null;

async function requestCatalog(): Promise<readonly AssetSearchResult[]> {
  const response = await fetch("/api/providers/polyhaven");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Poly Haven is unavailable right now.");
  }
  const body = (await response.json()) as { assets: AssetSearchResult[] };
  return body.assets;
}

/**
 * Loads the live Poly Haven catalog once and caches it in memory for the
 * lifetime of the page (or until CACHE_TTL_MS elapses). Concurrent callers
 * — including React's dev-mode double effect invocation — share a single
 * in-flight request instead of firing duplicate fetches.
 */
async function loadCatalog(): Promise<readonly AssetSearchResult[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.assets;
  }
  if (inflight) return inflight;

  inflight = requestCatalog()
    .then((assets) => {
      cache = { assets, fetchedAt: Date.now() };
      return assets;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function withRelevance(asset: AssetSearchResult, query: AssetSearchQuery): AssetSearchResult {
  const relevance = computeRelevance(asset, query);
  return { ...asset, matchScore: relevance.score, whyItFits: formatWhyItFits(relevance) };
}

/**
 * Live AssetSearchProvider backed by Poly Haven. Fetches + normalizes the
 * dataset once (via our own server route), then reuses the exact same pure
 * filterAssets/sortAssets used by the mock provider — no per-keystroke
 * network requests, since every call after the first is served from cache.
 */
export const polyHavenSearchProvider: AssetSearchProvider = {
  id: "polyhaven-live",
  label: "Poly Haven (live)",
  async search(query: AssetSearchQuery) {
    const catalog = await loadCatalog();
    const filtered = filterAssets(catalog, query);
    // Relevance must be computed before sorting: "best match" sorts by
    // matchScore, which is meaningless until it reflects THIS query.
    const scored = filtered.map((asset) => withRelevance(asset, query));
    return sortAssets(scored, query.sort);
  },
};
