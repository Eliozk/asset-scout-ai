import { describe, expect, it } from "vitest";
import { DEFAULT_QUERY, type AssetSearchQuery } from "@/domain/asset";
import type { SearchIntent } from "@/domain/search-intent";
import { applySearchIntent } from "./apply-search-intent";

function makeIntent(overrides: Partial<SearchIntent> = {}): SearchIntent {
  return {
    normalizedQuery: "medieval sword",
    meaningfulKeywords: ["medieval", "sword"],
    dimension: "3D",
    assetTypes: ["Weapon"],
    engines: ["Unity"],
    styles: ["Realistic"],
    platforms: ["mobile"],
    freeOnly: true,
    originalLanguage: "en",
    interpretationSummary: "A medieval sword.",
    ...overrides,
  };
}

describe("applySearchIntent", () => {
  it("always rewrites text to the normalizedQuery", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent());
    expect(result.text).toBe("medieval sword");
  });

  it("fills category from dimension when category is still the default 'all'", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent({ dimension: "3D" }));
    expect(result.category).toBe("3D");
  });

  it("never overrides an already-explicit category, even though 'all' can't be distinguished from untouched", () => {
    const explicit2D: AssetSearchQuery = { ...DEFAULT_QUERY, category: "2D" };
    const result = applySearchIntent(explicit2D, makeIntent({ dimension: "3D" }));
    expect(result.category).toBe("2D");
  });

  it("fills empty filter arrays (assetType, style) from the intent", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent());
    expect(result.filters.assetType).toEqual(["Weapon"]);
    expect(result.filters.style).toEqual(["Realistic"]);
  });

  it("regression: never applies intent.engines to filters.engine, even when the filter is empty — found live: every current provider normalizes to 'Engine-agnostic', so an engine-specific filter (e.g. Gemini inferring 'Unity' from '...for a Unity mobile game') can only ever zero out real results, never narrow them usefully", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent({ engines: ["Unity"] }));
    expect(result.filters.engine).toEqual([]);
  });

  it("never overrides an already-explicit filter array", () => {
    const explicit: AssetSearchQuery = {
      ...DEFAULT_QUERY,
      filters: { ...DEFAULT_QUERY.filters, assetType: ["Prop"] },
    };
    const result = applySearchIntent(explicit, makeIntent({ assetTypes: ["Weapon"] }));
    expect(result.filters.assetType).toEqual(["Prop"]);
  });

  it("fills pricing from freeOnly when pricing is still 'all'", () => {
    const freeResult = applySearchIntent(DEFAULT_QUERY, makeIntent({ freeOnly: true }));
    expect(freeResult.filters.pricing).toBe("free");

    const paidResult = applySearchIntent(DEFAULT_QUERY, makeIntent({ freeOnly: false }));
    expect(paidResult.filters.pricing).toBe("paid");
  });

  it("leaves pricing at 'all' when freeOnly is null", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent({ freeOnly: null }));
    expect(result.filters.pricing).toBe("all");
  });

  it("never overrides an already-explicit pricing filter", () => {
    const explicit: AssetSearchQuery = { ...DEFAULT_QUERY, filters: { ...DEFAULT_QUERY.filters, pricing: "paid" } };
    const result = applySearchIntent(explicit, makeIntent({ freeOnly: true }));
    expect(result.filters.pricing).toBe("paid");
  });

  it("regression: never applies intent.platforms to contextTags, even when contextTags is empty — found live: matchesContextTags requires the literal tag on the asset, and real provider tags (verified: a Sketchfab 'Police Car' result's own tags) never include a generic platform word like 'mobile', so Gemini inferring platforms: ['mobile'] from '...for a Unity mobile game' reproduced the same 0-result failure as the engine filter", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent({ platforms: ["mobile"] }));
    expect(result.contextTags).toEqual([]);
  });

  it("leaves already-present contextTags untouched regardless of platforms", () => {
    const explicit: AssetSearchQuery = { ...DEFAULT_QUERY, contextTags: ["unity"] };
    const result = applySearchIntent(explicit, makeIntent({ platforms: ["mobile"] }));
    expect(result.contextTags).toEqual(["unity"]);
  });

  it("leaves an empty intent field as the existing empty default rather than setting an empty array explicitly", () => {
    const result = applySearchIntent(DEFAULT_QUERY, makeIntent({ assetTypes: [], styles: [] }));
    expect(result.filters.assetType).toEqual([]);
    expect(result.filters.style).toEqual([]);
  });

  it("preserves sort — Gemini never touches sort order", () => {
    const withSort: AssetSearchQuery = { ...DEFAULT_QUERY, sort: "free-first" };
    const result = applySearchIntent(withSort, makeIntent());
    expect(result.sort).toBe("free-first");
  });
});
