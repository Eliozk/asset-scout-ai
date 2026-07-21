import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";

const { mockFetchSketchfabAssetById } = vi.hoisted(() => ({ mockFetchSketchfabAssetById: vi.fn() }));

vi.mock("@/lib/providers/sketchfab/provider", () => ({
  fetchSketchfabAssetById: mockFetchSketchfabAssetById,
}));

import { useMissingSketchfabFavorites } from "./useMissingSketchfabFavorites";

function makeAsset(id: string): AssetSearchResult {
  return {
    id,
    name: id,
    description: "",
    source: "sketchfab",
    category: "3D",
    assetType: "Prop",
    pricing: { model: "free" },
    license: "Custom",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://sketchfab.com/3d-models/x",
    addedAt: "2026-01-01",
  };
}

describe("useMissingSketchfabFavorites", () => {
  it("returns nothing and never calls the lookup when every favorite is already present", () => {
    const found = [makeAsset("sketchfab:abc")];
    const { result } = renderHook(() => useMissingSketchfabFavorites(["sketchfab:abc"], found));

    expect(result.current).toEqual([]);
    expect(mockFetchSketchfabAssetById).not.toHaveBeenCalled();
  });

  it("ignores non-Sketchfab favorite ids (e.g. Poly Haven) — those are resolved by the empty-text catalog search instead", () => {
    const { result } = renderHook(() => useMissingSketchfabFavorites(["polyhaven:chair"], []));

    expect(result.current).toEqual([]);
    expect(mockFetchSketchfabAssetById).not.toHaveBeenCalled();
  });

  it("looks up a missing Sketchfab favorite by id and returns it once resolved", async () => {
    const resolved = makeAsset("sketchfab:abc");
    mockFetchSketchfabAssetById.mockResolvedValue(resolved);

    const { result } = renderHook(() => useMissingSketchfabFavorites(["sketchfab:abc"], []));

    await waitFor(() => expect(result.current).toEqual([resolved]));
    expect(mockFetchSketchfabAssetById).toHaveBeenCalledWith("abc");
  });

  it("drops a favorite that can no longer be resolved (e.g. the model was deleted) rather than throwing", async () => {
    mockFetchSketchfabAssetById.mockResolvedValue(null);

    const { result } = renderHook(() => useMissingSketchfabFavorites(["sketchfab:gone"], []));

    await waitFor(() => expect(mockFetchSketchfabAssetById).toHaveBeenCalledWith("gone"));
    expect(result.current).toEqual([]);
  });
});
