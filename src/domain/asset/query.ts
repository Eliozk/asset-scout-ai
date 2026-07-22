import type {
  AssetCategory,
  AssetFileFormat,
  AssetLicense,
  AssetSourceId,
  AssetStyle,
  AssetType,
  EngineCompatibility,
} from "./types";

export const PRICING_FILTERS = ["all", "free", "paid"] as const;
export type PricingFilter = (typeof PRICING_FILTERS)[number];

export interface AssetFilters {
  readonly assetType: readonly AssetType[];
  readonly pricing: PricingFilter;
  readonly license: readonly AssetLicense[];
  readonly source: readonly AssetSourceId[];
  readonly format: readonly AssetFileFormat[];
  readonly engine: readonly EngineCompatibility[];
  readonly style: readonly AssetStyle[];
}

export const SORT_OPTIONS = [
  "best-match",
  "free-first",
  "price-asc",
  "price-desc",
  "name-asc",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_OPTION_LABELS: Readonly<Record<SortOption, string>> = {
  "best-match": "Best match",
  "free-first": "Free first",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
};

/**
 * Contract for a single search request. Providers receive this and return
 * normalized AssetSearchResult items; nothing provider-specific belongs here.
 */
export interface AssetSearchQuery {
  readonly text: string;
  readonly category: AssetCategory | "all";
  readonly filters: AssetFilters;
  /** Extra required tags contributed by quick project chips (e.g. "unity", "urp", "mobile"). */
  readonly contextTags: readonly string[];
  readonly sort: SortOption;
}

export const EMPTY_FILTERS: AssetFilters = {
  assetType: [],
  pricing: "all",
  license: [],
  source: [],
  format: [],
  engine: [],
  style: [],
};

export const DEFAULT_QUERY: AssetSearchQuery = {
  text: "",
  category: "all",
  filters: EMPTY_FILTERS,
  contextTags: [],
  sort: "best-match",
};

export function isFiltersEmpty(filters: AssetFilters): boolean {
  return (
    filters.assetType.length === 0 &&
    filters.pricing === "all" &&
    filters.license.length === 0 &&
    filters.source.length === 0 &&
    filters.format.length === 0 &&
    filters.engine.length === 0 &&
    filters.style.length === 0
  );
}
