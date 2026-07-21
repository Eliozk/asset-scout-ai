import type { AssetSearchProvider, AssetSearchQuery } from "@/domain/asset";
import { MOCK_ASSETS } from "@/data/mock-assets";
import { filterAssets } from "./filter";
import { sortAssets } from "./sort";

/**
 * In-memory implementation of AssetSearchProvider for Milestone 1. Resolves
 * asynchronously (as any real provider would) but with no artificial delay,
 * since the dataset is local and there's nothing genuine to wait for.
 */
export const mockAssetSearchProvider: AssetSearchProvider = {
  id: "mock-demo",
  label: "Demonstration dataset",
  async search(query: AssetSearchQuery) {
    const filtered = filterAssets(MOCK_ASSETS, query);
    return sortAssets(filtered, query.sort);
  },
};
