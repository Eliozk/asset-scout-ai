import type { AssetSearchResult } from "@/domain/asset";
import { cosineSimilarity } from "./cosine-similarity";

export interface SemanticRankingResult {
  readonly ranked: readonly AssetSearchResult[];
  /** 0-100 integer "AI Match" display percentage — present only for assets that had a precomputed embedding. */
  readonly scoresById: ReadonlyMap<string, number>;
}

function toDisplayPercent(similarity: number): number {
  return Math.round(Math.max(0, Math.min(1, similarity)) * 100);
}

/**
 * Re-ranks an already-filtered asset list by cosine similarity to a query
 * embedding, using ONLY precomputed embeddings (never recomputes any asset
 * embedding in the browser — that's the whole point of shipping a static
 * artifact). This never changes WHICH assets are present, only their order
 * and their displayed score.
 *
 * Assets missing a precomputed embedding (e.g. a Sketchfab/Pixabay/Kenney
 * result, or a Poly Haven asset added after the embeddings artifact was
 * generated) are NOT unconditionally placed after every scored asset —
 * that previously meant a strong literal/keyword match from a
 * non-embedded source (e.g. an exact "Car Kit" title) always lost to every
 * Poly Haven asset regardless of how weak its actual semantic similarity
 * was (see the Milestone 6 "car kit" investigation). Instead, an unscored
 * asset keeps its own existing deterministic matchScore (already a 0-100
 * keyword-relevance confidence number, the same scale as the semantic
 * display percentage) and competes directly on that combined scale — a
 * confident literal match can and should outrank a low-confidence semantic
 * guess. Only assets that ARE scored get a scoresById entry (the UI reads
 * that map, not matchScore, to decide "AI Match" vs "keyword relevance" —
 * see AssetCard.tsx), so this never mislabels an unscored asset as AI-ranked.
 *
 * Sort is stable and fully deterministic: ties break on asset id so output
 * ordering never depends on incidental array/traversal order.
 */
export function rankBySemanticSimilarity(
  assets: readonly AssetSearchResult[],
  queryEmbedding: Float32Array,
  embeddingsById: ReadonlyMap<string, Float32Array>,
): SemanticRankingResult {
  const scoresById = new Map<string, number>();
  const combined: { asset: AssetSearchResult; displayScore: number }[] = [];

  for (const asset of assets) {
    const embedding = embeddingsById.get(asset.id);
    if (embedding) {
      const displayScore = toDisplayPercent(cosineSimilarity(queryEmbedding, embedding));
      scoresById.set(asset.id, displayScore);
      combined.push({ asset, displayScore });
    } else {
      combined.push({ asset, displayScore: asset.matchScore });
    }
  }

  combined.sort((a, b) => b.displayScore - a.displayScore || a.asset.id.localeCompare(b.asset.id));

  return {
    ranked: combined.map((entry) => entry.asset),
    scoresById,
  };
}
