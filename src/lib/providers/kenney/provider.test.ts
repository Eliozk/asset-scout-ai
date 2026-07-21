import { describe, expect, it } from "vitest";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { createKenneyCatalogSearchProvider } from "./provider";
import { searchAllProviders } from "@/lib/search/aggregate-providers";
import { fetchCombinedResults } from "@/lib/search/combined-search";

function makeAsset(overrides: Partial<AssetSearchResult> = {}): AssetSearchResult {
  return {
    id: "kenney:modular-cave-kit",
    name: "Modular Cave Kit",
    description: "This 3D pack contains 40 files. It is tagged as: tiles, modular, cave",
    source: "kenney",
    category: "3D",
    assetType: "Environment",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Low-poly",
    tags: ["tiles", "modular", "cave"],
    matchScore: 50,
    whyItFits: "Game asset pack from Kenney's Authorized Indexed Catalog.",
    externalUrl: "https://kenney.nl/assets/modular-cave-kit",
    addedAt: "2026-07-10",
    thumbnailUrl: "https://kenney.nl/media/pages/assets/modular-cave-kit/x/preview.png",
    ...overrides,
  };
}

const FIXTURE_CATALOG: readonly AssetSearchResult[] = [
  makeAsset(),
  makeAsset({
    id: "kenney:blaster-kit",
    name: "Blaster Kit",
    description: "This 3D pack contains 40 files. It is tagged as: blaster, weapon, target",
    assetType: "Weapon",
    tags: ["blaster", "weapon", "target"],
  }),
  makeAsset({
    id: "kenney:input-prompts",
    name: "Input Prompts",
    description: "This 2D pack contains 1500 files. It is tagged as: input, prompt, gamepad",
    category: "2D",
    assetType: "UI",
    style: "Cartoon",
    tags: ["input", "prompt", "gamepad"],
  }),
];

describe("createKenneyCatalogSearchProvider", () => {
  it("returns every catalog entry for an empty query, unlike the search-required live providers", async () => {
    const provider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const results = await provider.search(DEFAULT_QUERY);
    expect(results).toHaveLength(3);
  });

  it("filters by search text using the shared deterministic keyword filter", async () => {
    const provider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "blaster" };
    const results = await provider.search(query);
    expect(results.map((a) => a.id)).toEqual(["kenney:blaster-kit"]);
  });

  it("filters by category (2D vs 3D)", async () => {
    const provider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const results = await provider.search({ ...DEFAULT_QUERY, category: "2D" });
    expect(results.map((a) => a.id)).toEqual(["kenney:input-prompts"]);
  });

  it("filters by source, so Kenney can be isolated or excluded via the generic source filter", async () => {
    const provider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const matching = await provider.search({ ...DEFAULT_QUERY, filters: { ...DEFAULT_QUERY.filters, source: ["kenney"] } });
    const excluded = await provider.search({ ...DEFAULT_QUERY, filters: { ...DEFAULT_QUERY.filters, source: ["sketchfab"] } });
    expect(matching).toHaveLength(3);
    expect(excluded).toHaveLength(0);
  });

  it("computes real relevance scores and 'why it fits' text per query rather than the neutral placeholder", async () => {
    const provider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const results = await provider.search({ ...DEFAULT_QUERY, text: "blaster" });
    expect(results[0].whyItFits).not.toBe("Game asset pack from Kenney's Authorized Indexed Catalog.");
  });

  it("returns nothing (never throws) for an empty catalog — the missing/invalid-catalog fallback case", async () => {
    const provider = createKenneyCatalogSearchProvider([]);
    const results = await provider.search(DEFAULT_QUERY);
    expect(results).toEqual([]);
  });
});

describe("Kenney provider aggregation", () => {
  it("keeps contributing real results when queried alongside a failing provider (Promise.allSettled isolation)", async () => {
    const kenneyProvider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const failingProvider: AssetSearchProvider = {
      id: "failing-provider",
      label: "Failing",
      search: () => Promise.reject(new Error("simulated upstream failure")),
    };

    const outcome = await searchAllProviders([kenneyProvider, failingProvider], DEFAULT_QUERY);

    expect(outcome.results.some((asset) => asset.source === "kenney")).toBe(true);
    expect(outcome.providerOutcomes).toEqual(
      expect.arrayContaining([
        { providerId: "kenney-catalog", status: "fulfilled" },
        expect.objectContaining({ providerId: "failing-provider", status: "rejected" }),
      ]),
    );
  });

  it("blends into the shared combined-results pipeline (filter + dedupe + sort) alongside another provider", async () => {
    const kenneyProvider = createKenneyCatalogSearchProvider(FIXTURE_CATALOG);
    const otherProvider: AssetSearchProvider = {
      id: "other-provider",
      label: "Other",
      search: async () => [
        {
          ...makeAsset({ id: "polyhaven:unrelated", name: "Unrelated Prop" }),
          source: "polyhaven",
        },
      ],
    };

    const { results } = await fetchCombinedResults([kenneyProvider, otherProvider], DEFAULT_QUERY);

    expect(results.some((asset) => asset.source === "kenney")).toBe(true);
    expect(results.some((asset) => asset.source === "polyhaven")).toBe(true);
  });
});
