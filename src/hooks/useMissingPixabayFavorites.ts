"use client";

import type { AssetSearchResult } from "@/domain/asset";
import { fetchPixabayAssetById } from "@/lib/providers/pixabay/provider";
import { useMissingFavoritesById } from "./useMissingFavoritesById";

const PIXABAY_PREFIX = "pixabay:";

/**
 * Resolves favorited Pixabay images missing from `foundResults` — see
 * useMissingFavoritesById for why this is needed (Pixabay has no
 * "browse everything" endpoint, unlike Poly Haven/Kenney). This also keeps
 * every Pixabay image display "fresh" (a live per-id lookup, never a stored
 * copy), consistent with Pixabay's anti-permanent-hotlinking terms.
 */
export function useMissingPixabayFavorites(
  favoriteIds: readonly string[],
  foundResults: readonly AssetSearchResult[],
): readonly AssetSearchResult[] {
  return useMissingFavoritesById(PIXABAY_PREFIX, fetchPixabayAssetById, favoriteIds, foundResults);
}
