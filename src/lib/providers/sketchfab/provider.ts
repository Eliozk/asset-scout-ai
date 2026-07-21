import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { filterAssets } from "@/lib/search/filter";
import { sortAssets } from "@/lib/search/sort";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";

const CACHE_TTL_MS = 15 * 60 * 1000; // short — Sketchfab is queried per search text, not one whole catalog
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  readonly assets: readonly AssetSearchResult[];
  readonly fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<readonly AssetSearchResult[]>>();

async function requestSketchfab(searchText: string): Promise<readonly AssetSearchResult[]> {
  const response = await fetch(`/api/providers/sketchfab?q=${encodeURIComponent(searchText)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Sketchfab is unavailable right now.");
  }
  const body = (await response.json()) as { assets: AssetSearchResult[] };
  return body.assets;
}

/**
 * Loads (and caches, per distinct search text, for CACHE_TTL_MS) Sketchfab's
 * search results for one query. Concurrent callers for the same text share a
 * single in-flight request. Cache size is capped so a long session doing
 * many different searches can't grow this unbounded.
 */
async function loadForText(searchText: string): Promise<readonly AssetSearchResult[]> {
  const cached = cache.get(searchText);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.assets;
  }

  const existingInflight = inflight.get(searchText);
  if (existingInflight) return existingInflight;

  const promise = requestSketchfab(searchText)
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

/**
 * Looks up one Sketchfab asset by its uid (the part of the id after the
 * "sketchfab:" prefix) via our own /api/providers/sketchfab/model/[uid]
 * route — never Sketchfab directly. Used to resolve a favorited Sketchfab
 * asset that an empty-text search can't return (Sketchfab has no
 * "browse everything" endpoint the way Poly Haven does). Returns null for a
 * not-found or failed lookup rather than throwing, since a single
 * unresolvable favorite shouldn't break the whole favorites page.
 */
export async function fetchSketchfabAssetById(uid: string): Promise<AssetSearchResult | null> {
  try {
    const response = await fetch(`/api/providers/sketchfab/model/${encodeURIComponent(uid)}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { asset: AssetSearchResult };
    return body.asset;
  } catch {
    return null;
  }
}

function withRelevance(asset: AssetSearchResult, query: AssetSearchQuery): AssetSearchResult {
  const relevance = computeRelevance(asset, query);
  return { ...asset, matchScore: relevance.score, whyItFits: formatWhyItFits(relevance) };
}

/**
 * Live AssetSearchProvider backed by Sketchfab's public search API. Unlike
 * Poly Haven, Sketchfab supports real server-side text search — so this
 * provider deliberately does NOT search when the query is empty (browsing
 * "everything on Sketchfab" isn't a meaningful default), and trusts
 * Sketchfab's own text relevance rather than re-applying our stricter
 * AND-keyword filter on top of it. Every OTHER filter (category, license,
 * style, etc.) still applies via the same pure filterAssets used everywhere
 * else.
 */
export const sketchfabSearchProvider: AssetSearchProvider = {
  id: "sketchfab-live",
  label: "Sketchfab (live)",
  async search(query: AssetSearchQuery) {
    const searchText = query.text.trim();
    if (searchText === "") return [];

    const rawResults = await loadForText(searchText);
    const filtered = filterAssets(rawResults, { ...query, text: "" });
    const scored = filtered.map((asset) => withRelevance(asset, query));
    return sortAssets(scored, query.sort);
  },
};
