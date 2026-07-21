import { describe, expect, it } from "vitest";
import type { AssetSearchResult, AssetSourceId } from "@/domain/asset";
import { applySourceDiversity } from "./source-diversity";

function makeAsset(id: string, source: AssetSourceId): AssetSearchResult {
  return {
    id,
    name: id,
    description: "",
    source,
    category: "3D",
    assetType: "Prop",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://example.com",
    addedAt: "2026-01-01",
  };
}

describe("applySourceDiversity", () => {
  it("returns the list unchanged when it already fits within the limit", () => {
    const ranked = [makeAsset("a", "polyhaven"), makeAsset("b", "sketchfab")];
    expect(applySourceDiversity(ranked, 60)).toEqual(ranked);
  });

  it("never changes matchScore, whyItFits, or the order of any included item", () => {
    // 100 Poly Haven items (always ranked first) push a single Kenney item to position 101 — beyond any limit under 100.
    const polyHaven = Array.from({ length: 100 }, (_, i) => makeAsset(`ph-${i}`, "polyhaven"));
    const kenney = [makeAsset("kenney-1", "kenney")];
    const ranked = [...polyHaven, ...kenney];

    const result = applySourceDiversity(ranked, 60, 3);

    // Every included item is bit-for-bit identical to its entry in `ranked` — no score inflation, no mutation.
    for (const asset of result) {
      const original = ranked.find((a) => a.id === asset.id);
      expect(asset).toEqual(original);
    }
  });

  it("guarantees a minimum presence for a source that would otherwise be entirely cut off by the render limit", () => {
    const polyHaven = Array.from({ length: 100 }, (_, i) => makeAsset(`ph-${i}`, "polyhaven"));
    const kenney = [makeAsset("kenney-1", "kenney"), makeAsset("kenney-2", "kenney")];
    const ranked = [...polyHaven, ...kenney]; // Kenney items sit at rank 101-102, beyond a 60-item limit

    const result = applySourceDiversity(ranked, 60, 3);

    expect(result.some((asset) => asset.source === "kenney")).toBe(true);
    expect(result.filter((asset) => asset.source === "kenney")).toHaveLength(2); // only 2 exist total, both guaranteed
  });

  it("preserves the original relative rank order — the result is always a subsequence of `ranked`", () => {
    const polyHaven = Array.from({ length: 50 }, (_, i) => makeAsset(`ph-${i}`, "polyhaven"));
    const sketchfab = Array.from({ length: 20 }, (_, i) => makeAsset(`sf-${i}`, "sketchfab"));
    const ranked = [...polyHaven, ...sketchfab];

    const result = applySourceDiversity(ranked, 60, 3);
    const rankIndex = new Map(ranked.map((asset, index) => [asset.id, index]));
    const resultIndices = result.map((asset) => rankIndex.get(asset.id)!);

    expect(resultIndices).toEqual([...resultIndices].sort((a, b) => a - b));
  });

  it("respects the overall limit exactly, even with multiple under-represented sources", () => {
    const polyHaven = Array.from({ length: 100 }, (_, i) => makeAsset(`ph-${i}`, "polyhaven"));
    const kenney = [makeAsset("kenney-1", "kenney")];
    const pixabay = [makeAsset("pixabay-1", "pixabay")];
    const sketchfab = [makeAsset("sketchfab-1", "sketchfab")];
    const ranked = [...polyHaven, ...kenney, ...pixabay, ...sketchfab];

    const result = applySourceDiversity(ranked, 10, 3);

    expect(result).toHaveLength(10);
    expect(result.some((a) => a.source === "kenney")).toBe(true);
    expect(result.some((a) => a.source === "pixabay")).toBe(true);
    expect(result.some((a) => a.source === "sketchfab")).toBe(true);
  });

  it("is a pure function — calling it twice with the same input gives the same output", () => {
    const polyHaven = Array.from({ length: 80 }, (_, i) => makeAsset(`ph-${i}`, "polyhaven"));
    const kenney = [makeAsset("kenney-1", "kenney")];
    const ranked = [...polyHaven, ...kenney];

    expect(applySourceDiversity(ranked, 60)).toEqual(applySourceDiversity(ranked, 60));
  });
});
