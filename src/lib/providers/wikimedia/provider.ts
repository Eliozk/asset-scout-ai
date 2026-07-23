import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { filterAssets } from "@/lib/search/filter";
import { sortAssets } from "@/lib/search/sort";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  readonly assets: readonly AssetSearchResult[];
  readonly fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<readonly AssetSearchResult[]>>();

async function requestWikimedia(searchText: string): Promise<readonly AssetSearchResult[]> {
  const response = await fetch(`/api/providers/wikimedia?q=${encodeURIComponent(searchText)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Wikimedia Commons is unavailable right now.");
  }
  const body = (await response.json()) as { assets: AssetSearchResult[] };
  return body.assets;
}

async function loadForText(searchText: string): Promise<readonly AssetSearchResult[]> {
  const cached = cache.get(searchText);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.assets;
  }

  const existingInflight = inflight.get(searchText);
  if (existingInflight) return existingInflight;

  const promise = requestWikimedia(searchText)
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
 * Live AssetSearchProvider backed by Wikimedia Commons' public MediaWiki
 * search API. Architecturally identical to sketchfabSearchProvider/
 * ambientCGSearchProvider: real per-query text search, no results for an
 * empty query.
 */
export const wikimediaSearchProvider: AssetSearchProvider = {
  id: "wikimedia-live",
  label: "Wikimedia Commons (live)",
  async search(query: AssetSearchQuery) {
    const searchText = query.text.trim();
    if (searchText === "") return [];

    const rawResults = await loadForText(searchText);
    const filtered = filterAssets(rawResults, { ...query, text: "" });
    const scored = filtered.map((asset) => withRelevance(asset, query));
    return sortAssets(scored, query.sort);
  },
};
