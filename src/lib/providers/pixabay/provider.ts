import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { filterAssets } from "@/lib/search/filter";
import { sortAssets } from "@/lib/search/sort";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";

const CACHE_TTL_MS = 15 * 60 * 1000; // short client-side cache for snappy repeat searches within a session
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  readonly assets: readonly AssetSearchResult[];
  readonly fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<readonly AssetSearchResult[]>>();

async function requestPixabay(searchText: string): Promise<readonly AssetSearchResult[]> {
  const response = await fetch(`/api/providers/pixabay?q=${encodeURIComponent(searchText)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Pixabay is unavailable right now.");
  }
  const body = (await response.json()) as { assets: AssetSearchResult[] };
  return body.assets;
}

/**
 * Loads (and caches, per distinct search text, for CACHE_TTL_MS) Pixabay's
 * search results for one query. This client-side cache is purely for UI
 * snappiness — the mandatory 24h "cache Pixabay requests" compliance point
 * lives server-side, in fetch-assets.ts's Next fetch Data Cache, which
 * governs whether pixabay.com itself is ever re-hit.
 */
async function loadForText(searchText: string): Promise<readonly AssetSearchResult[]> {
  const cached = cache.get(searchText);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.assets;
  }

  const existingInflight = inflight.get(searchText);
  if (existingInflight) return existingInflight;

  const promise = requestPixabay(searchText)
    .then((assets) => {
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
      }
      cache.set(searchText, { assets, fetchedAt: Date.now() });
      return assets;
    })
    .finally(() => {
      inflight.delete(searchText);
    });

  inflight.set(searchText, promise);
  return promise;
}

function withRelevance(asset: AssetSearchResult, query: AssetSearchQuery): AssetSearchResult {
  const relevance = computeRelevance(asset, query);
  return { ...asset, matchScore: relevance.score, whyItFits: formatWhyItFits(relevance) };
}

/**
 * Looks up one Pixabay image by id via our own
 * /api/providers/pixabay/image/[id] route — never Pixabay directly. Used to
 * resolve a favorited Pixabay image with a fresh preview URL each time it's
 * displayed (see the Route Handler's doc comment for why "fresh lookup, no
 * stored copy" matters for Pixabay's anti-hotlinking terms). Returns null
 * for a not-found or failed lookup rather than throwing.
 */
export async function fetchPixabayAssetById(id: string): Promise<AssetSearchResult | null> {
  try {
    const response = await fetch(`/api/providers/pixabay/image/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { asset: AssetSearchResult };
    return body.asset;
  } catch {
    return null;
  }
}

/**
 * Live AssetSearchProvider backed by Pixabay's public image API. Like
 * Sketchfab, deliberately does NOT search when the query is empty — Pixabay
 * would return its generic "popular images" feed, which isn't a meaningful
 * default and would spend rate-limit budget on every page load for no
 * useful result. Every OTHER filter (category, license, style, etc.) still
 * applies via the same pure filterAssets used everywhere else.
 */
export const pixabaySearchProvider: AssetSearchProvider = {
  id: "pixabay-live",
  label: "Pixabay (live)",
  async search(query: AssetSearchQuery) {
    const searchText = query.text.trim();
    if (searchText === "") return [];

    const rawResults = await loadForText(searchText);
    const filtered = filterAssets(rawResults, { ...query, text: "" });
    const scored = filtered.map((asset) => withRelevance(asset, query));
    return sortAssets(scored, query.sort);
  },
};
