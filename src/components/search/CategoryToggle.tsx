"use client";

import type { AssetCategory } from "@/domain/asset";

const OPTIONS: readonly { label: string; value: AssetCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "2D", value: "2D" },
  { label: "3D", value: "3D" },
];

interface CategoryToggleProps {
  readonly value: AssetCategory | "all";
  readonly onChange: (value: AssetCategory | "all") => void;
}

export function CategoryToggle({ value, onChange }: CategoryToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter by dimension"
      className="mx-auto mt-5 inline-flex rounded-lg border border-border-strong bg-surface-elevated p-1"
    >
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`focus-ring rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected ? "bg-accent-blue text-white" : "text-text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
