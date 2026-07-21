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
 * Assets missing a precomputed embedding (e.g. added to the live Poly Haven
 * catalog after the embeddings artifact was generated) keep their existing
 * relative order, appended after every asset that DID get a semantic score
 * — they're never dropped, just not semantically ranked yet.
 *
 * Sort is stable and fully deterministic: ties break on asset id so output
 * ordering never depends on incidental array/traversal order.
 */
export function rankBySemanticSimilarity(
  assets: readonly AssetSearchResult[],
  queryEmbedding: Float32Array,
  embeddingsById: ReadonlyMap<string, Float32Array>,
): SemanticRankingResult {
  const scored: { asset: AssetSearchResult; rawScore: number }[] = [];
  const unscored: AssetSearchResult[] = [];

  for (const asset of assets) {
    const embedding = embeddingsById.get(asset.id);
    if (embedding) {
      scored.push({ asset, rawScore: cosineSimilarity(queryEmbedding, embedding) });
    } else {
      unscored.push(asset);
    }
  }

  scored.sort((a, b) => b.rawScore - a.rawScore || a.asset.id.localeCompare(b.asset.id));

  const scoresById = new Map<string, number>();
  for (const { asset, rawScore } of scored) {
    scoresById.set(asset.id, toDisplayPercent(rawScore));
  }

  return {
    ranked: [...scored.map((entry) => entry.asset), ...unscored],
    scoresById,
  };
}
