import type { AssetCategory, AssetDimension, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { tokenizeSearchText } from "./tokenize";

function matchesText(asset: AssetSearchResult, rawText: string): boolean {
  const terms = tokenizeSearchText(rawText);
  if (terms.length === 0) return true;

  const haystack = [
    asset.name,
    asset.description,
    asset.style,
    asset.assetType,
    ...asset.tags,
    ...(asset.formats ?? []),
    ...asset.engines,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

/** An asset dimensioned "both" (e.g. a flat texture usable in 2D or 3D work) matches either query filter. */
function matchesCategory(assetCategory: AssetDimension, queryCategory: AssetCategory | "all"): boolean {
  if (queryCategory === "all") return true;
  if (assetCategory === "both") return true;
  return assetCategory === queryCategory;
}

function matchesContextTags(asset: AssetSearchResult, contextTags: readonly string[]): boolean {
  if (contextTags.length === 0) return true;
  const tagSet = new Set(asset.tags.map((tag) => tag.toLowerCase()));
  return contextTags.every((tag) => tagSet.has(tag.toLowerCase()));
}

function matchesPricing(asset: AssetSearchResult, pricing: AssetSearchQuery["filters"]["pricing"]): boolean {
  if (pricing === "all") return true;
  return asset.pricing.model === pricing;
}

function matchesMulti<T extends string>(value: T, selected: readonly T[]): boolean {
  return selected.length === 0 || selected.includes(value);
}

function matchesAnyOf<T extends string>(values: readonly T[], selected: readonly T[]): boolean {
  return selected.length === 0 || values.some((value) => selected.includes(value));
}

/**
 * Pure filtering of the normalized asset list against a search query. No I/O,
 * no randomness — safe to unit test directly and safe to reuse from any
 * future provider implementation.
 */
export function filterAssets(
  assets: readonly AssetSearchResult[],
  query: AssetSearchQuery,
): AssetSearchResult[] {
  const { filters } = query;

  return assets.filter((asset) => {
    if (!matchesCategory(asset.category, query.category)) return false;
    if (!matchesText(asset, query.text)) return false;
    if (!matchesContextTags(asset, query.contextTags)) return false;
    if (!matchesPricing(asset, filters.pricing)) return false;
    if (!matchesMulti(asset.assetType, filters.assetType)) return false;
    if (!matchesMulti(asset.license, filters.license)) return false;
    if (!matchesMulti(asset.source, filters.source)) return false;
    if (!matchesMulti(asset.style, filters.style)) return false;
    if (!matchesAnyOf(asset.formats ?? [], filters.format)) return false;
    if (!matchesAnyOf(asset.engines, filters.engine)) return false;
    return true;
  });
}
