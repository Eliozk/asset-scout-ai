import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { filterAssets } from "@/lib/search/filter";
import { sortAssets } from "@/lib/search/sort";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";
import { validateKenneyCatalog } from "./catalog-schema";
import rawCatalog from "@/data/kenney-catalog/catalog.json";

function withRelevance(asset: AssetSearchResult, query: AssetSearchQuery): AssetSearchResult {
  const relevance = computeRelevance(asset, query);
  return { ...asset, matchScore: relevance.score, whyItFits: formatWhyItFits(relevance) };
}

/**
 * Factory (not just a singleton) so tests can exercise the search/filter/sort
 * behavior against a small fixture catalog instead of the real generated one.
 */
export function createKenneyCatalogSearchProvider(catalog: readonly AssetSearchResult[]): AssetSearchProvider {
  return {
    id: "kenney-catalog",
    label: "Kenney (Authorized Indexed Catalog)",
    async search(query: AssetSearchQuery) {
      const filtered = filterAssets(catalog, query);
      const scored = filtered.map((asset) => withRelevance(asset, query));
      return sortAssets(scored, query.sort);
    },
  };
}

/**
 * Statically imported (bundled at build time) — the live app makes zero
 * network calls to Kenney at search time. The generation script
 * (scripts/generate-kenney-catalog.mts) is the only thing that ever talks to
 * kenney.nl. validateKenneyCatalog defensively re-checks the imported JSON
 * shape so a hand-edited or corrupted committed catalog.json degrades to
 * fewer/zero Kenney results instead of crashing the app or any other
 * provider.
 */
const catalog = validateKenneyCatalog(rawCatalog);

export const kenneyCatalogSearchProvider: AssetSearchProvider = createKenneyCatalogSearchProvider(catalog);
