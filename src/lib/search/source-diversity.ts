import type { AssetSearchResult } from "@/domain/asset";

export const DEFAULT_MIN_PER_SOURCE = 3;

/**
 * Guarantees every source that has any matching results gets at least
 * `minPerSource` of them inside the rendered/visible window, without
 * touching any asset's matchScore or whyItFits and without ever reordering
 * anything — this is a pure SELECTION step over an already-ranked list, not
 * a re-ranking step. The returned array is always a subsequence of `ranked`
 * in its original order.
 *
 * Why this exists: "Best match" ranks assets with a precomputed semantic
 * embedding ahead of everything else (see rankBySemanticSimilarity). Poly
 * Haven's catalog is embedded and huge; Sketchfab/Kenney/Pixabay results
 * are not (yet) embedded, so for a broad/popular query they can be
 * mathematically present in the full ranked list yet never actually appear
 * within a 60-card render limit — a newly connected source could be
 * invisible by default even though it's genuinely returning matches. This
 * reserves a small, fixed number of slots per source (not a percentage, not
 * a score boost) so every connected source stays discoverable, while the
 * large majority of the render budget is still driven purely by honest rank
 * order. Only activates when the ranked list is actually longer than the
 * limit — never changes anything when everything already fits.
 */
export function applySourceDiversity(
  ranked: readonly AssetSearchResult[],
  limit: number,
  minPerSource: number = DEFAULT_MIN_PER_SOURCE,
): readonly AssetSearchResult[] {
  if (ranked.length <= limit) return ranked;

  const seenPerSource = new Map<string, number>();
  const guaranteedIds = new Set<string>();
  for (const asset of ranked) {
    const count = seenPerSource.get(asset.source) ?? 0;
    if (count < minPerSource) {
      guaranteedIds.add(asset.id);
      seenPerSource.set(asset.source, count + 1);
    }
  }

  const result: AssetSearchResult[] = [];
  let nonGuaranteedBudget = limit - guaranteedIds.size;

  for (const asset of ranked) {
    if (result.length >= limit) break;
    if (guaranteedIds.has(asset.id)) {
      result.push(asset);
    } else if (nonGuaranteedBudget > 0) {
      result.push(asset);
      nonGuaranteedBudget -= 1;
    }
  }

  return result;
}
