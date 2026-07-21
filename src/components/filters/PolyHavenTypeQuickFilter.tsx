"use client";

import { ASSET_TYPES, type AssetType } from "@/domain/asset";

const MODEL_ASSET_TYPES: readonly AssetType[] = ASSET_TYPES.filter(
  (type) => type !== "HDRI" && type !== "Texture",
);

const OPTIONS: readonly { label: string; types: readonly AssetType[] }[] = [
  { label: "HDRIs", types: ["HDRI"] },
  { label: "Textures", types: ["Texture"] },
  { label: "Models", types: MODEL_ASSET_TYPES },
];

function sameTypeSet(a: readonly AssetType[], b: readonly AssetType[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((type) => set.has(type));
}

interface PolyHavenTypeQuickFilterProps {
  readonly selected: readonly AssetType[];
  readonly onChange: (next: readonly AssetType[]) => void;
}

/**
 * Quick shortcuts onto the existing "Asset type" filter for Poly Haven's own
 * top-level taxonomy (HDRI / Texture / Model). Purely a UI convenience — it
 * only ever sets `filters.assetType`, so it adds no new domain field and
 * every source's filtering logic stays untouched.
 */
export function PolyHavenTypeQuickFilter({ selected, onChange }: PolyHavenTypeQuickFilterProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">Poly Haven content</legend>
      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Quick filter by Poly Haven content type">
        {OPTIONS.map((option) => {
          const isActive = sameTypeSet(selected, option.types);
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(isActive ? [] : option.types)}
              className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan"
                  : "border-border-strong bg-surface-elevated text-text-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
