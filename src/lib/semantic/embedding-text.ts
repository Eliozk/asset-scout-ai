import type { AssetSearchResult } from "@/domain/asset";

/**
 * Builds the text an embedding model sees for one asset, using ONLY name +
 * description + category (2D/3D/both) + tags + asset type — validated
 * against the live Poly Haven catalog in Milestone 3 Phase 0/0.1. Deliberately
 * excludes engines/formats/style/pricing so embeddings never encode
 * compatibility claims we don't actually have for every asset.
 *
 * Used identically by the build-time embedding generator (scripts/generate-embeddings.mts)
 * and, implicitly, nowhere else — the browser only ever embeds the user's
 * query text, never re-embeds assets.
 */
export function buildEmbeddingText(
  asset: Pick<AssetSearchResult, "name" | "description" | "category" | "tags" | "assetType">,
): string {
  return [asset.name, asset.description, asset.category, asset.assetType, ...asset.tags].join(" ");
}
