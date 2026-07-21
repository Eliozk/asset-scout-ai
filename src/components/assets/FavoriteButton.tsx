"use client";

import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  readonly assetName: string;
  readonly isFavorite: boolean;
  readonly onToggle: () => void;
}

export function FavoriteButton({ assetName, isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${assetName} from favorites` : `Add ${assetName} to favorites`}
      className={`focus-ring inline-flex size-9 items-center justify-center rounded-full border transition-colors ${
        isFavorite
          ? "border-accent-purple/50 bg-accent-purple/10 text-accent-purple"
          : "border-border-strong bg-surface-elevated text-text-muted hover:text-foreground"
      }`}
    >
      <Heart size={17} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
