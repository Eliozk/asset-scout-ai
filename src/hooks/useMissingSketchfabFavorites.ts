"use client";

import type { AssetSearchResult } from "@/domain/asset";
import { fetchSketchfabAssetById } from "@/lib/providers/sketchfab/provider";
import { useMissingFavoritesById } from "./useMissingFavoritesById";

const SKETCHFAB_PREFIX = "sketchfab:";

/**
 * Resolves favorited Sketchfab assets missing from `foundResults` — see
 * useMissingFavoritesById for why this is needed (Sketchfab has no
 * "browse everything" endpoint, unlike Poly Haven/Kenney).
 */
export function useMissingSketchfabFavorites(
  favoriteIds: readonly string[],
  foundResults: readonly AssetSearchResult[],
): readonly AssetSearchResult[] {
  return useMissingFavoritesById(SKETCHFAB_PREFIX, fetchSketchfabAssetById, favoriteIds, foundResults);
}
