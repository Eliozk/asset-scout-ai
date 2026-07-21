import type { AssetSearchProvider, AssetSearchQuery } from "@/domain/asset";
import { searchAllProviders, type AggregatedSearchResult } from "./aggregate-providers";
import { deduplicateAssets } from "./deduplicate";
import { sortAssets } from "./sort";

/**
 * Shared by useAssetSearch (main deterministic results) and useSemanticRanking
 * (its broader, text-cleared candidate pool) so the parallel-query + timeout
 * + dedup + combined-sort pipeline exists in exactly one place.
 */
export async function fetchCombinedResults(
  providers: readonly AssetSearchProvider[],
  query: AssetSearchQuery,
  timeoutMs?: number,
): Promise<AggregatedSearchResult> {
  const { results, providerOutcomes } = await searchAllProviders(providers, query, timeoutMs);
  const deduped = deduplicateAssets(results);
  const sorted = sortAssets(deduped, query.sort);
  return { results: sorted, providerOutcomes };
}
