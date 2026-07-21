import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";

const { mockFetchPixabayAssetById } = vi.hoisted(() => ({ mockFetchPixabayAssetById: vi.fn() }));

vi.mock("@/lib/providers/pixabay/provider", () => ({
  fetchPixabayAssetById: mockFetchPixabayAssetById,
}));

import { useMissingPixabayFavorites } from "./useMissingPixabayFavorites";

function makeAsset(id: string): AssetSearchResult {
  return {
    id,
    name: id,
    description: "",
    source: "pixabay",
    category: "2D",
    assetType: "Texture",
    pricing: { model: "free" },
    license: "Royalty-Free",
    licenseDetail: "Pixabay Content License",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://pixabay.com/en/x-1/",
    addedAt: "1970-01-01",
  };
}

describe("useMissingPixabayFavorites", () => {
  it("returns nothing and never calls the lookup when every favorite is already present", () => {
    const found = [makeAsset("pixabay:1")];
    const { result } = renderHook(() => useMissingPixabayFavorites(["pixabay:1"], found));

    expect(result.current).toEqual([]);
    expect(mockFetchPixabayAssetById).not.toHaveBeenCalled();
  });

  it("ignores non-Pixabay favorite ids — those are resolved by their own providers instead", () => {
    const { result } = renderHook(() => useMissingPixabayFavorites(["polyhaven:chair"], []));

    expect(result.current).toEqual([]);
    expect(mockFetchPixabayAssetById).not.toHaveBeenCalled();
  });

  it("looks up a missing Pixabay favorite by id and returns it once resolved", async () => {
    const resolved = makeAsset("pixabay:1");
    mockFetchPixabayAssetById.mockResolvedValue(resolved);

    const { result } = renderHook(() => useMissingPixabayFavorites(["pixabay:1"], []));

    await waitFor(() => expect(result.current).toEqual([resolved]));
    expect(mockFetchPixabayAssetById).toHaveBeenCalledWith("1");
  });

  it("drops a favorite that can no longer be resolved (e.g. the image was removed) rather than throwing", async () => {
    mockFetchPixabayAssetById.mockResolvedValue(null);

    const { result } = renderHook(() => useMissingPixabayFavorites(["pixabay:gone"], []));

    await waitFor(() => expect(mockFetchPixabayAssetById).toHaveBeenCalledWith("gone"));
    expect(result.current).toEqual([]);
  });
});
