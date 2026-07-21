import type { AssetSearchResult } from "@/domain/asset";
import { ASSET_STYLE_GRADIENTS, ASSET_TYPE_ICONS } from "./asset-visuals";

interface AssetPreviewProps {
  readonly asset: AssetSearchResult;
}

/**
 * Locally controlled CSS preview — no remote images, no next/image config
 * needed. Every asset renders a deterministic gradient plus a representative
 * icon so the grid still reads visually distinct at a glance.
 */
export function AssetPreview({ asset }: AssetPreviewProps) {
  const Icon = ASSET_TYPE_ICONS[asset.assetType];
  const gradient = ASSET_STYLE_GRADIENTS[asset.style];

  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br ${gradient}`}
    >
      <Icon size={40} strokeWidth={1.25} className="text-white/70" aria-hidden="true" />
      <span className="absolute left-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm">
        {asset.category}
      </span>
    </div>
  );
}
