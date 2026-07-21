"use client";

import {
  ASSET_FILE_FORMATS,
  ASSET_LICENSES,
  ASSET_SOURCES,
  ASSET_STYLES,
  ASSET_TYPES,
  ENGINE_COMPATIBILITIES,
  ASSET_SOURCE_IDS,
  EMPTY_FILTERS,
  isFiltersEmpty,
  type AssetFilters,
  type PricingFilter,
} from "@/domain/asset";
import { FilterCheckboxGroup } from "./FilterCheckboxGroup";
import { PolyHavenTypeQuickFilter } from "./PolyHavenTypeQuickFilter";

const PRICING_OPTIONS: readonly { label: string; value: PricingFilter }[] = [
  { label: "All", value: "all" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
];

interface FiltersPanelProps {
  readonly filters: AssetFilters;
  readonly onChange: (filters: AssetFilters) => void;
}

export function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  function update<K extends keyof AssetFilters>(key: K, value: AssetFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Filters</h2>
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          disabled={isFiltersEmpty(filters)}
          className="focus-ring text-xs font-medium text-accent-cyan hover:text-cyan-300 disabled:cursor-not-allowed disabled:text-text-faint"
        >
          Clear all
        </button>
      </div>

      <PolyHavenTypeQuickFilter selected={filters.assetType} onChange={(next) => update("assetType", next)} />

      <FilterCheckboxGroup
        title="Asset type"
        idPrefix="asset-type"
        options={ASSET_TYPES}
        selected={filters.assetType}
        onChange={(next) => update("assetType", next)}
      />

      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Free / Paid</legend>
        <div className="mt-2.5 flex flex-col gap-2">
          {PRICING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-text-muted hover:text-foreground"
            >
              <input
                type="radio"
                name="pricing-filter"
                checked={filters.pricing === option.value}
                onChange={() => update("pricing", option.value)}
                className="focus-ring size-4 border-border-strong bg-surface-elevated accent-accent-blue"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FilterCheckboxGroup
        title="License"
        idPrefix="license"
        options={ASSET_LICENSES}
        selected={filters.license}
        onChange={(next) => update("license", next)}
      />

      <FilterCheckboxGroup
        title="Source"
        idPrefix="source"
        options={ASSET_SOURCE_IDS.map((id) => ({ value: id, label: ASSET_SOURCES[id].label }))}
        selected={filters.source}
        onChange={(next) => update("source", next)}
      />

      <FilterCheckboxGroup
        title="File format"
        idPrefix="format"
        options={ASSET_FILE_FORMATS}
        selected={filters.format}
        onChange={(next) => update("format", next)}
      />

      <FilterCheckboxGroup
        title="Engine"
        idPrefix="engine"
        options={ENGINE_COMPATIBILITIES}
        selected={filters.engine}
        onChange={(next) => update("engine", next)}
      />

      <FilterCheckboxGroup
        title="Style"
        idPrefix="style"
        options={ASSET_STYLES}
        selected={filters.style}
        onChange={(next) => update("style", next)}
      />
    </div>
  );
}
