import type { AssetSearchResult } from "@/domain/asset/types";

/**
 * Milestone 3 Phase 0 proof-of-concept only. Not imported by production code.
 *
 * Builds the text an embedding model sees for one asset, using ONLY the
 * fields the task specifies: name + description + category (2D/3D/both) +
 * tags + asset type. Deliberately excludes engines/formats/style/pricing so
 * the POC can't accidentally "cheat" by embedding compatibility data the
 * live provider doesn't actually have for every asset.
 */
export function buildEmbeddingText(
  asset: Pick<AssetSearchResult, "name" | "description" | "category" | "tags" | "assetType">,
): string {
  return [asset.name, asset.description, asset.category, asset.assetType, ...asset.tags].join(" ");
}
