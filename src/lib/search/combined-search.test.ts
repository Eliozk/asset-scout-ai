import { describe, expect, it } from "vitest";
import type { AssetSearchProvider, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { fetchCombinedResults } from "./combined-search";

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

function makeProvider(id: string, assets: readonly AssetSearchResult[], error?: string): AssetSearchProvider {
  return {
    id,
    label: id,
    async search() {
      if (error) throw new Error(error);
      return assets;
    },
  };
}

describe("fetchCombinedResults", () => {
  it("merges, deduplicates, and re-sorts results from multiple providers", async () => {
    const polyHaven = makeProvider("polyhaven", [
      makeAsset({ id: "ph1", name: "Low Score", source: "polyhaven", matchScore: 10 }),
      makeAsset({ id: "ph2", name: "High Score", source: "polyhaven", matchScore: 90 }),
    ]);
    const sketchfab = makeProvider("sketchfab", [
      makeAsset({ id: "sf1", name: "Mid Score", source: "sketchfab", matchScore: 50 }),
    ]);

    const { results } = await fetchCombinedResults([polyHaven, sketchfab], { ...DEFAULT_QUERY, sort: "best-match" });

    expect(results.map((r) => r.id)).toEqual(["ph2", "sf1", "ph1"]);
  });

  it("still returns the healthy provider's results, plus its outcome, when one provider fails", async () => {
    const polyHaven = makeProvider("polyhaven", [makeAsset({ id: "ph1", source: "polyhaven" })]);
    const sketchfab = makeProvider("sketchfab", [], "Sketchfab is unavailable right now.");

    const { results, providerOutcomes } = await fetchCombinedResults([polyHaven, sketchfab], DEFAULT_QUERY);

    expect(results.map((r) => r.id)).toEqual(["ph1"]);
    expect(providerOutcomes).toContainEqual({
      providerId: "sketchfab",
      status: "rejected",
      error: "Sketchfab is unavailable right now.",
    });
  });

  it("deduplicates exact same-source duplicates in the merged output", async () => {
    const providerA = makeProvider("a", [
      makeAsset({ id: "1", name: "Dragon", source: "polyhaven" }),
      makeAsset({ id: "2", name: "Dragon", source: "polyhaven" }),
    ]);

    const { results } = await fetchCombinedResults([providerA], DEFAULT_QUERY);
    expect(results).toHaveLength(1);
  });
});
