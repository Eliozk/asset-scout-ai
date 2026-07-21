"use client";

import { useAssetSearch } from "@/hooks/useAssetSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { PoweredByPolyHaven } from "@/components/layout/PoweredByPolyHaven";

export function FavoritesExperience() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  // Empty query pulls the whole live catalog (already cached by the provider);
  // we filter down to favorites client-side. Stale ids from an older dataset
  // simply won't match anything here — they don't break the page.
  const { results, status, error } = useAssetSearch();
  const favoriteAssets = results.filter((asset) => favoriteIds.includes(asset.id));

  if (status === "loading") return <LoadingState />;
  if (status === "error") {
    return <ErrorState message={error ?? "Poly Haven is unavailable right now, so favorites can't be loaded."} />;
  }

  return (
    <div>
      <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
        <span>
          <span className="font-semibold text-foreground">{favoriteAssets.length}</span> saved{" "}
          {favoriteAssets.length === 1 ? "asset" : "assets"}
        </span>
        <PoweredByPolyHaven />
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
