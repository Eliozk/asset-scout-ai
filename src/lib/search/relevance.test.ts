import { describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { computeRelevance, formatWhyItFits } from "./relevance";

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: "test-asset",
    name: "Weathered Stone Wall",
    description: "A tileable CC0 material.",
    source: "polyhaven",
    category: "both",
    assetType: "Texture",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: ["stone", "wall", "outdoor"],
    matchScore: 0,
    whyItFits: "",
    externalUrl: "https://polyhaven.com/a/test",
    addedAt: "2026-01-01",
    ...overrides,
  };
}

describe("computeRelevance", () => {
  it("gives a higher score when the query text matches tags", () => {
    const asset = makeAsset({});
    const noMatch = computeRelevance(asset, { ...DEFAULT_QUERY, text: "spaceship laser" });
    const match = computeRelevance(asset, { ...DEFAULT_QUERY, text: "stone" });
    expect(match.score).toBeGreaterThan(noMatch.score);
    expect(match.reasons.some((r) => r.includes("stone"))).toBe(true);
  });

  it("rewards a matching category", () => {
    const asset = makeAsset({ category: "3D" });
    const withCategory = computeRelevance(asset, { ...DEFAULT_QUERY, category: "3D" });
    const withoutCategory = computeRelevance(asset, { ...DEFAULT_QUERY, category: "all" });
    expect(withCategory.score).toBeGreaterThan(withoutCategory.score);
  });

  it("stays within 0-99", () => {
    const asset = makeAsset({ tags: ["a", "b", "c"] });
    const result = computeRelevance(asset, { ...DEFAULT_QUERY, text: "a b c", contextTags: ["a"] });
    expect(result.score).toBeLessThanOrEqual(99);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("never claims AI analysis in the generated explanation", () => {
    const asset = makeAsset({});
    const relevance = computeRelevance(asset, { ...DEFAULT_QUERY, text: "stone" });
    const text = formatWhyItFits(relevance).toLowerCase();
    expect(text).not.toContain("ai");
    expect(text).not.toContain("artificial intelligence");
  });

  it("falls back to a neutral sentence when there are no match reasons", () => {
    const asset = makeAsset({ license: "Proprietary", pricing: { model: "paid", amount: 5, currency: "USD" } });
    const relevance = computeRelevance(asset, DEFAULT_QUERY);
    expect(formatWhyItFits(relevance)).toBe("Matches your current filters.");
  });

  it("does not let stopwords increase the score over an empty query", () => {
    const asset = makeAsset({});
    const empty = computeRelevance(asset, { ...DEFAULT_QUERY, text: "" });
    const allStopwords = computeRelevance(asset, { ...DEFAULT_QUERY, text: "a for an the with of" });
    expect(allStopwords.score).toBe(empty.score);
    expect(allStopwords.reasons).toEqual(empty.reasons);
  });

  it("does not cite stopwords in the 'why it fits' reasons", () => {
    const asset = makeAsset({ name: "Dirty Football", tags: ["ball", "sports"] });
    const relevance = computeRelevance(asset, { ...DEFAULT_QUERY, text: "a worn ball for a realistic sports game" });
    const matchReason = relevance.reasons.find((r) => r.startsWith("matches"));
    expect(matchReason).toBeDefined();
    for (const stopword of ["a", "for", "the", "with"]) {
      expect(matchReason).not.toContain(`"${stopword}"`);
      expect(matchReason?.split(", ")).not.toContain(stopword);
    }
    expect(matchReason).toContain("ball");
  });

  it("scores meaningful keywords on their own merit, not diluted by stopword count", () => {
    const asset = makeAsset({ tags: ["dirty", "ball"] });
    // Every meaningful term matches; stopwords ("a", "for") must not count
    // toward the denominator and drag the ratio down.
    const relevance = computeRelevance(asset, { ...DEFAULT_QUERY, text: "a dirty ball for" });
    expect(relevance.score).toBe(80); // baseline 40 + full-ratio bonus (2/2 real terms matched) of 40
  });

  it("still matches short-but-meaningful game-asset terms like vr and 2d", () => {
    const asset = makeAsset({ tags: ["vr", "2d"] });
    const relevance = computeRelevance(asset, { ...DEFAULT_QUERY, text: "vr 2d" });
    expect(relevance.reasons.some((r) => r.includes("vr") && r.includes("2d"))).toBe(true);
  });

  it("keeps existing single-keyword search behavior working", () => {
    const asset = makeAsset({});
    const relevance = computeRelevance(asset, { ...DEFAULT_QUERY, text: "stone" });
    expect(formatWhyItFits(relevance)).toContain("stone");
  });
});
