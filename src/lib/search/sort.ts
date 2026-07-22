import type { AssetSearchResult, SortOption } from "@/domain/asset";

function priceValue(asset: AssetSearchResult): number {
  return asset.pricing.model === "free" ? 0 : asset.pricing.amount;
}

/**
 * Pure sorting of asset results. Never mutates the input array.
 */
export function sortAssets(
  assets: readonly AssetSearchResult[],
  sort: SortOption,
): AssetSearchResult[] {
  const sorted = [...assets];

  switch (sort) {
    case "free-first":
      return sorted.sort((a, b) => {
        const pricingDifference =
          Number(a.pricing.model !== "free") - Number(b.pricing.model !== "free");
        return pricingDifference || b.matchScore - a.matchScore;
      });
    case "price-asc":
      return sorted.sort((a, b) => priceValue(a) - priceValue(b));
    case "price-desc":
      return sorted.sort((a, b) => priceValue(b) - priceValue(a));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "best-match":
    default:
      return sorted.sort((a, b) => b.matchScore - a.matchScore);
  }
}
