"use client";

import { SORT_OPTIONS, SORT_OPTION_LABELS, type SortOption } from "@/domain/asset";

interface SortSelectProps {
  readonly value: SortOption;
  readonly onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-text-muted">
        Sort by
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="focus-ring rounded-md border border-border-strong bg-surface-elevated px-2.5 py-1.5 text-sm text-foreground"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_OPTION_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
