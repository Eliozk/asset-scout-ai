import { describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";
import { rankBySemanticSimilarity } from "./ranking";

function makeAsset(id: string, overrides: Partial<AssetSearchResult> = {}): AssetSearchResult {
  return {
    id,
    name: id,
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

describe("rankBySemanticSimilarity", () => {
  const query = new Float32Array([1, 0, 0]);
  const close = new Float32Array([0.9, 0.1, 0]); // high similarity to query
  const mid = new Float32Array([0.5, 0.5, 0]); // medium similarity
  const far = new Float32Array([0, 1, 0]); // orthogonal / low similarity

  it("ranks assets by descending cosine similarity", () => {
    const a = makeAsset("a");
    const b = makeAsset("b");
    const c = makeAsset("c");
    const embeddingsById = new Map([
      ["a", far],
      ["b", close],
      ["c", mid],
    ]);

    const result = rankBySemanticSimilarity([a, b, c], query, embeddingsById);
    expect(result.ranked.map((asset) => asset.id)).toEqual(["b", "c", "a"]);
  });

  it("returns 0-100 integer display scores, clamped to a minimum of 0", () => {
    const a = makeAsset("a");
    const embeddingsById = new Map([["a", close]]);
    const result = rankBySemanticSimilarity([a], query, embeddingsById);
    const score = result.scoresById.get("a")!;
    expect(Number.isInteger(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("appends assets with no precomputed embedding after all scored assets, without dropping them", () => {
    const scored = makeAsset("scored");
    const unscored = makeAsset("unscored");
    const embeddingsById = new Map([["scored", close]]);

    const result = rankBySemanticSimilarity([unscored, scored], query, embeddingsById);
    expect(result.ranked.map((asset) => asset.id)).toEqual(["scored", "unscored"]);
    expect(result.scoresById.has("unscored")).toBe(false);
    expect(result.scoresById.has("scored")).toBe(true);
  });

  it("breaks exact score ties deterministically by asset id", () => {
    const a = makeAsset("zebra");
    const b = makeAsset("apple");
    const sameEmbedding = new Float32Array([1, 0, 0]);
    const embeddingsById = new Map([
      ["zebra", sameEmbedding],
      ["apple", sameEmbedding],
    ]);

    const result = rankBySemanticSimilarity([a, b], query, embeddingsById);
    expect(result.ranked.map((asset) => asset.id)).toEqual(["apple", "zebra"]);
  });

  it("produces identical ordering across repeated calls with the same inputs (stable ordering)", () => {
    const a = makeAsset("a");
    const b = makeAsset("b");
    const c = makeAsset("c");
    const embeddingsById = new Map([
      ["a", far],
      ["b", close],
      ["c", mid],
    ]);

    const first = rankBySemanticSimilarity([a, b, c], query, embeddingsById);
    const second = rankBySemanticSimilarity([a, b, c], query, embeddingsById);
    expect(first.ranked.map((asset) => asset.id)).toEqual(second.ranked.map((asset) => asset.id));
  });

  it("never changes which assets are present, only their order", () => {
    const a = makeAsset("a");
    const b = makeAsset("b");
    const embeddingsById = new Map([["a", far]]);
    const result = rankBySemanticSimilarity([a, b], query, embeddingsById);
    expect(new Set(result.ranked.map((asset) => asset.id))).toEqual(new Set(["a", "b"]));
  });
});
