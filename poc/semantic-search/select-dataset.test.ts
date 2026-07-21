import { describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset/types";
import { selectPocDataset } from "./select-dataset";

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: overrides.id ?? "test-asset",
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
    externalUrl: "https://polyhaven.com/a/test",
    addedAt: "2026-01-01",
    ...overrides,
  };
}

describe("selectPocDataset", () => {
  const catalog: AssetSearchResult[] = [
    makeAsset({
      id: "polyhaven:dirty_football",
      name: "Dirty Football",
      assetType: "Prop",
      tags: ["football", "dirty"],
    }),
    makeAsset({ id: "polyhaven:american_football", name: "American Football", assetType: "Prop", tags: ["football"] }),
    makeAsset({
      id: "polyhaven:concrete_1",
      name: "Anti Slip Concrete",
      assetType: "Texture",
      category: "both",
      tags: ["concrete", "weathered"],
    }),
    makeAsset({
      id: "polyhaven:sunset_jhbcentral",
      name: "Joburg Central Sunset",
      assetType: "HDRI",
      tags: ["city", "roof", "skyline", "twilight"],
    }),
    makeAsset({
      id: "polyhaven:shanghai_riverside",
      name: "Shanghai Riverside",
      assetType: "HDRI",
      tags: ["city", "riverside"],
    }),
    makeAsset({
      id: "polyhaven:rooftop_night",
      name: "Rooftop Night",
      assetType: "HDRI",
      tags: ["roof", "twilight"],
    }),
    makeAsset({
      id: "polyhaven:abandoned_hall_01",
      name: "Abandoned Hall 01",
      assetType: "HDRI",
      tags: ["abandoned", "hall", "city"],
    }),
    ...Array.from({ length: 20 }, (_, i) =>
      makeAsset({ id: `polyhaven:filler_${i}`, name: `Filler Prop ${i}`, assetType: "Prop", tags: ["filler"] }),
    ),
  ];

  it("always includes the Dirty Football anchor when present", () => {
    const result = selectPocDataset(catalog, 15);
    expect(result.anchorFound).toBe(true);
    expect(result.assets.some((a) => a.id === "polyhaven:dirty_football")).toBe(true);
  });

  it("reports anchorFound: false when Dirty Football is absent", () => {
    const withoutAnchor = catalog.filter((a) => a.id !== "polyhaven:dirty_football");
    const result = selectPocDataset(withoutAnchor, 15);
    expect(result.anchorFound).toBe(false);
  });

  it("guarantees the preferred real city-skyline HDRIs are included when present", () => {
    const result = selectPocDataset(catalog, 15);
    expect(result.citySkylineIdsFound.sort()).toEqual(["rooftop_night", "shanghai_riverside", "sunset_jhbcentral"].sort());
    const ids = result.assets.map((a) => a.id);
    expect(ids).toContain("polyhaven:sunset_jhbcentral");
    expect(ids).toContain("polyhaven:shanghai_riverside");
    expect(ids).toContain("polyhaven:rooftop_night");
  });

  it("reports only the city-skyline ids that actually exist in the catalog, never fabricating", () => {
    const partial = catalog.filter((a) => a.id !== "polyhaven:rooftop_night");
    const result = selectPocDataset(partial, 15);
    expect(result.citySkylineIdsFound.sort()).toEqual(["shanghai_riverside", "sunset_jhbcentral"].sort());
    expect(result.assets.some((a) => a.id === "polyhaven:rooftop_night")).toBe(false);
  });

  it("excludes indoor/abandoned-sounding HDRIs from the keyword-matched city/sunset pool", () => {
    // Abandoned Hall 01 matches "city" by tag but reads as an indoor scene;
    // it should only appear if pulled in by generic filler, not preferred.
    const smallCatalog = catalog.filter(
      (a) => !a.id.startsWith("polyhaven:filler_") || a.id === "polyhaven:filler_0",
    );
    const result = selectPocDataset(smallCatalog, 6);
    expect(result.assets.some((a) => a.id === "polyhaven:abandoned_hall_01")).toBe(false);
  });

  it("includes concrete/weathered textures", () => {
    const result = selectPocDataset(catalog, 15);
    expect(result.assets.map((a) => a.id)).toContain("polyhaven:concrete_1");
  });

  it("never returns duplicates and respects the target size", () => {
    const result = selectPocDataset(catalog, 15);
    const ids = result.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.assets.length).toBeLessThanOrEqual(15);
  });

  it("stays within the 40-60 asset range against the real-shaped full catalog size", () => {
    const bigCatalog = [
      ...catalog,
      ...Array.from({ length: 2260 }, (_, i) =>
        makeAsset({ id: `polyhaven:pad_${i}`, name: `Pad ${i}`, assetType: "Prop", tags: ["pad"] }),
      ),
    ];
    const result = selectPocDataset(bigCatalog, 48);
    expect(result.assets.length).toBeGreaterThanOrEqual(40);
    expect(result.assets.length).toBeLessThanOrEqual(60);
  });
});
