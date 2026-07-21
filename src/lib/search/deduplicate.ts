import type { AssetSearchResult } from "@/domain/asset";

/**
 * Conservative cross-source deduplication: only collapses entries that are
 * an EXACT (source, normalized-name) match — e.g. accidental repeats within
 * one provider's own paginated result set. Deliberately never fuzzy-matches
 * across different sources (a Poly Haven model and a Sketchfab model are
 * never merged just because their names look similar) — different
 * platforms host different files, and we can't safely verify they're "the
 * same" asset without risking an incorrect merge.
 */
export function deduplicateAssets(assets: readonly AssetSearchResult[]): readonly AssetSearchResult[] {
  const seen = new Set<string>();
  const result: AssetSearchResult[] = [];

  for (const asset of assets) {
    const key = `${asset.source}:${asset.name.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(asset);
  }

  return result;
}
