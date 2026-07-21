"use client";

import type { AssetCategory } from "@/domain/asset";

interface ChipConfig {
  readonly label: string;
  readonly kind: "tag" | "category";
  readonly value: string;
}

const CHIPS: readonly ChipConfig[] = [
  { label: "Unity", kind: "tag", value: "unity" },
  { label: "URP", kind: "tag", value: "urp" },
  { label: "Mobile", kind: "tag", value: "mobile" },
  { label: "3D", kind: "category", value: "3D" },
];

interface ProjectChipsProps {
  readonly contextTags: readonly string[];
  readonly category: AssetCategory | "all";
  readonly onToggleTag: (tag: string) => void;
  readonly onToggleCategory: (category: AssetCategory) => void;
}

export function ProjectChips({ contextTags, category, onToggleTag, onToggleCategory }: ProjectChipsProps) {
  return (
    <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2" role="group" aria-label="Quick project filters">
      {CHIPS.map((chip) => {
        const isActive =
          chip.kind === "tag" ? contextTags.includes(chip.value) : category === chip.value;

        return (
          <button
            key={chip.label}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              chip.kind === "tag" ? onToggleTag(chip.value) : onToggleCategory(chip.value as AssetCategory)
            }
            className={`focus-ring rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan"
                : "border-border-strong bg-surface-elevated text-text-muted hover:text-foreground"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
