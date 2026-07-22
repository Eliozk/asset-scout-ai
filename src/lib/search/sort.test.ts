import { describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";
import { sortAssets } from "./sort";

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: "test-asset",
    name: "Test Asset",
    description: "",
    source: "sketchfab",
    category: "3D",
    assetType: "Character",
    pricing: { model: "free" },
    license: "CC0",
    formats: ["FBX"],
    engines: ["Unity"],
    style: "Low-poly",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://example.com",
    addedAt: "2026-01-01",
    ...overrides,
  };
}

describe("sortAssets", () => {
  const cheap = makeAsset({ id: "cheap", name: "Bravo", matchScore: 60, pricing: { model: "paid", amount: 5, currency: "USD" } });
  const free = makeAsset({ id: "free", name: "Alpha", matchScore: 90, pricing: { model: "free" } });
  const expensive = makeAsset({ id: "expensive", name: "Charlie", matchScore: 75, pricing: { model: "paid", amount: 40, currency: "USD" } });
  const assets = [cheap, free, expensive];

  it("sorts by best match descending", () => {
    expect(sortAssets(assets, "best-match").map((a) => a.id)).toEqual(["free", "expensive", "cheap"]);
  });

  it("sorts by price ascending, treating free as zero", () => {
    expect(sortAssets(assets, "price-asc").map((a) => a.id)).toEqual(["free", "cheap", "expensive"]);
  });

  it("puts free assets first while preserving relevance within pricing groups", () => {
    const anotherFree = makeAsset({ id: "another-free", matchScore: 40, pricing: { model: "free" } });
    expect(sortAssets([cheap, anotherFree, expensive, free], "free-first").map((a) => a.id)).toEqual([
      "free",
      "another-free",
      "expensive",
      "cheap",
    ]);
  });

  it("sorts by price descending", () => {
    expect(sortAssets(assets, "price-desc").map((a) => a.id)).toEqual(["expensive", "cheap", "free"]);
  });

  it("sorts by name ascending", () => {
    expect(sortAssets(assets, "name-asc").map((a) => a.id)).toEqual(["free", "cheap", "expensive"]);
  });

  it("does not mutate the input array", () => {
    const original = [...assets];
    sortAssets(assets, "price-desc");
    expect(assets).toEqual(original);
  });
});
