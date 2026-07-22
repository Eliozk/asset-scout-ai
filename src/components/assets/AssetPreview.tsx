"use client";

import { useState } from "react";
import Image from "next/image";
import type { AssetSearchResult } from "@/domain/asset";
import { ASSET_STYLE_GRADIENTS, ASSET_TYPE_ICONS } from "./asset-visuals";

interface AssetPreviewProps {
  readonly asset: AssetSearchResult;
}

function categoryLabel(category: AssetSearchResult["category"]): string {
  return category === "both" ? "2D / 3D" : category;
}

/**
 * Renders the asset's real thumbnail when one is available (e.g. live Poly
 * Haven results), falling back to a locally-controlled CSS/gradient preview
 * — for assets with no thumbnail, or if the remote image fails to load. The
 * wrapper's fixed aspect ratio is set either way, so there's no layout shift.
 */
export function AssetPreview({ asset }: AssetPreviewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = ASSET_TYPE_ICONS[asset.assetType];
  const gradient = ASSET_STYLE_GRADIENTS[asset.style];
  const showImage = asset.thumbnailUrl !== undefined && !imageFailed;

  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br ${gradient} p-5`}
    >
      {showImage ? (
        // No `fill`: an intrinsic width/height lets the image lay out at its own
        // natural size (via h-auto/w-auto), only ever shrinking to fit the padded
        // box (max-h-full/max-w-full) — never upscaling a low-res thumbnail to
        // fill the card. object-contain guarantees no distortion either way.
        <Image
          src={asset.thumbnailUrl!}
          alt={`${asset.name} preview thumbnail`}
          width={640}
          height={480}
          className="h-auto max-h-full w-auto max-w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon size={40} strokeWidth={1.25} className="text-white/70" aria-hidden="true" />
      )}
      <span className="absolute left-2.5 top-2.5 rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm">
        {categoryLabel(asset.category)}
      </span>
    </div>
  );
}
