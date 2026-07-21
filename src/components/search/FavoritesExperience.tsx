"use client";

import { MOCK_ASSETS } from "@/data/mock-assets";
import { useFavorites } from "@/hooks/useFavorites";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { EmptyState } from "@/components/states/EmptyState";

export function FavoritesExperience() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const favoriteAssets = MOCK_ASSETS.filter((asset) => favoriteIds.includes(asset.id));

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        <span className="font-semibold text-foreground">{favoriteAssets.length}</span>{" "}
        saved {favoriteAssets.length === 1 ? "asset" : "assets"}
        <span className="ml-1.5 text-text-faint">(demonstration data)</span>
      </p>

      {favoriteAssets.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Favorite assets from the Explore page to find them here."
        />
      ) : (
        <AssetGrid assets={favoriteAssets} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
      )}
    </div>
  );
}
