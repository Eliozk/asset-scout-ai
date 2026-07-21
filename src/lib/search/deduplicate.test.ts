import { describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";
import { deduplicateAssets } from "./deduplicate";

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: overrides.id ?? "test",
    name: "Test Asset",
    description: "",
    source: "polyhaven",
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
    ...overrides,
  };
}

describe("deduplicateAssets", () => {
  it("removes exact (source, name) duplicates", () => {
    const a = makeAsset({ id: "a", name: "Dragon", source: "polyhaven" });
    const dup = makeAsset({ id: "a-dup", name: "Dragon", source: "polyhaven" });

    const result = deduplicateAssets([a, dup]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("is case-insensitive when comparing names", () => {
    const a = makeAsset({ id: "a", name: "Dragon", source: "polyhaven" });
    const dup = makeAsset({ id: "a-dup", name: "DRAGON", source: "polyhaven" });

    expect(deduplicateAssets([a, dup])).toHaveLength(1);
  });

  it("never merges the same name across different sources", () => {
    const fromPolyHaven = makeAsset({ id: "ph", name: "Dragon", source: "polyhaven" });
    const fromSketchfab = makeAsset({ id: "sf", name: "Dragon", source: "sketchfab" });

    const result = deduplicateAssets([fromPolyHaven, fromSketchfab]);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id).sort()).toEqual(["ph", "sf"]);
  });

  it("preserves order and does not mutate the input array", () => {
    const a = makeAsset({ id: "a", name: "A" });
    const b = makeAsset({ id: "b", name: "B" });
    const input = [a, b];

    const result = deduplicateAssets(input);
    expect(result).toEqual([a, b]);
    expect(input).toEqual([a, b]);
  });
});
