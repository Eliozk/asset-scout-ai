import type { AssetSearchResult } from "@/domain/asset";
import { AssetCard } from "./AssetCard";

interface AssetGridProps {
  readonly assets: readonly AssetSearchResult[];
  readonly favoriteIds: readonly string[];
  readonly onToggleFavorite: (assetId: string) => void;
}

export function AssetGrid({ assets, favoriteIds, onToggleFavorite }: AssetGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          isFavorite={favoriteIds.includes(asset.id)}
          onToggleFavorite={() => onToggleFavorite(asset.id)}
        />
      ))}
    </div>
  );
}
