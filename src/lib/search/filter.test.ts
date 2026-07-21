import { describe, expect, it } from "vitest";
import type { AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY, EMPTY_FILTERS } from "@/domain/asset";
import { filterAssets } from "./filter";

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: "test-asset",
    name: "Test Asset",
    description: "A test asset description.",
    source: "sketchfab",
    category: "3D",
    assetType: "Character",
    pricing: { model: "free" },
    license: "CC0",
    formats: ["FBX"],
    engines: ["Unity"],
    style: "Low-poly",
    tags: ["test"],
    matchScore: 50,
    whyItFits: "Because it is a test.",
    externalUrl: "https://example.com",
    addedAt: "2026-01-01",
    ...overrides,
  };
}

function makeQuery(overrides: Partial<AssetSearchQuery>): AssetSearchQuery {
  return { ...DEFAULT_QUERY, ...overrides };
}

describe("filterAssets", () => {
  const dragon = makeAsset({
    id: "dragon",
    name: "Low-Poly Dragon",
    description: "A rigged dragon for mobile games.",
    category: "3D",
    style: "Low-poly",
    engines: ["Unity"],
    tags: ["dragon", "unity", "urp", "mobile"],
  });
  const sword = makeAsset({
    id: "sword",
    name: "Realistic Sword",
    description: "A PBR medieval sword prop.",
    category: "3D",
    style: "Realistic",
    assetType: "Weapon",
    pricing: { model: "paid", amount: 12, currency: "USD" },
    license: "Royalty-Free",
    engines: ["Unreal"],
    tags: ["sword", "medieval"],
  });
  const sprite = makeAsset({
    id: "sprite",
    name: "Pixel Sprite Pack",
    description: "A 2D pixel character sprite sheet.",
    category: "2D",
    style: "Pixel-art",
    source: "itchio",
    formats: ["PNG"],
    engines: ["Godot"],
    tags: ["sprite", "pixel", "mobile"],
  });
  const texture = makeAsset({
    id: "texture",
    name: "Aerial Asphalt Texture",
    description: "A tileable road texture usable on 2D or 3D surfaces.",
    source: "polyhaven",
    category: "both",
    assetType: "Texture",
    style: "Realistic",
    engines: ["Engine-agnostic"],
    formats: undefined,
    tags: ["asphalt", "road"],
  });
  const assets = [dragon, sword, sprite, texture];

  it("returns every asset for an empty query", () => {
    expect(filterAssets(assets, DEFAULT_QUERY)).toHaveLength(4);
  });

  it("matches free text against name, description, and tags", () => {
    const result = filterAssets(assets, makeQuery({ text: "dragon" }));
    expect(result.map((a) => a.id)).toEqual(["dragon"]);
  });

  it("requires every whitespace-separated search term to match", () => {
    const result = filterAssets(assets, makeQuery({ text: "pixel mobile" }));
    expect(result.map((a) => a.id)).toEqual(["sprite"]);
  });

  it("filters by category", () => {
    const result = filterAssets(assets, makeQuery({ category: "2D" }));
    expect(result.map((a) => a.id).sort()).toEqual(["sprite", "texture"].sort());
  });

  it("includes 'both' dimension assets in both the 2D and 3D filters", () => {
    const in2d = filterAssets(assets, makeQuery({ category: "2D" }));
    const in3d = filterAssets(assets, makeQuery({ category: "3D" }));
    expect(in2d.map((a) => a.id)).toContain("texture");
    expect(in3d.map((a) => a.id)).toContain("texture");
  });

  it("does not crash matching text when formats is not provided", () => {
    const result = filterAssets(assets, makeQuery({ text: "asphalt" }));
    expect(result.map((a) => a.id)).toEqual(["texture"]);
  });

  it("filters by pricing", () => {
    const result = filterAssets(assets, makeQuery({ filters: { ...EMPTY_FILTERS, pricing: "paid" } }));
    expect(result.map((a) => a.id)).toEqual(["sword"]);
  });

  it("filters by engine compatibility", () => {
    const result = filterAssets(assets, makeQuery({ filters: { ...EMPTY_FILTERS, engine: ["Godot"] } }));
    expect(result.map((a) => a.id)).toEqual(["sprite"]);
  });

  it("filters by required context tags from quick project chips", () => {
    const result = filterAssets(assets, makeQuery({ contextTags: ["urp"] }));
    expect(result.map((a) => a.id)).toEqual(["dragon"]);
  });

  it("combines text, category, and filters", () => {
    const result = filterAssets(
      assets,
      makeQuery({
        text: "sword",
        category: "3D",
        filters: { ...EMPTY_FILTERS, pricing: "paid", license: ["Royalty-Free"] },
      }),
    );
    expect(result.map((a) => a.id)).toEqual(["sword"]);
  });

  it("returns an empty array when nothing matches", () => {
    const result = filterAssets(assets, makeQuery({ text: "nonexistent-term" }));
    expect(result).toEqual([]);
  });
});
