import { describe, expect, it } from "vitest";
import { isValidKenneyCatalogEntry, isValidKenneyCatalogManifest, validateKenneyCatalog } from "./catalog-schema";
import type { AssetSearchResult } from "@/domain/asset";

function makeValidEntry(overrides: Partial<AssetSearchResult> = {}): AssetSearchResult {
  return {
    id: "kenney:modular-cave-kit",
    name: "Modular Cave Kit",
    description: "",
    source: "kenney",
    category: "3D",
    assetType: "Environment",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Low-poly",
    tags: ["cave"],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://kenney.nl/assets/modular-cave-kit",
    addedAt: "2026-07-10",
    ...overrides,
  } as AssetSearchResult;
}

describe("isValidKenneyCatalogEntry", () => {
  it("accepts a well-formed entry", () => {
    expect(isValidKenneyCatalogEntry(makeValidEntry())).toBe(true);
  });

  it("rejects an entry from a different source pretending to be kenney", () => {
    expect(isValidKenneyCatalogEntry(makeValidEntry({ source: "sketchfab" as never }))).toBe(false);
  });

  it("rejects an entry whose license isn't CC0", () => {
    expect(isValidKenneyCatalogEntry(makeValidEntry({ license: "Proprietary" as never }))).toBe(false);
  });

  it("rejects an entry whose externalUrl isn't on the trusted kenney.nl/assets/ prefix", () => {
    expect(isValidKenneyCatalogEntry(makeValidEntry({ externalUrl: "https://evil.example.com/x" }))).toBe(false);
  });

  it("rejects a non-object value", () => {
    expect(isValidKenneyCatalogEntry(null)).toBe(false);
    expect(isValidKenneyCatalogEntry("just a string")).toBe(false);
  });
});

describe("validateKenneyCatalog", () => {
  it("returns every entry from a well-formed catalog array", () => {
    const catalog = [makeValidEntry(), makeValidEntry({ id: "kenney:blaster-kit" })];
    expect(validateKenneyCatalog(catalog)).toHaveLength(2);
  });

  it("drops malformed entries but keeps the valid ones", () => {
    const catalog = [makeValidEntry(), { garbage: true }, "not an object"];
    const result = validateKenneyCatalog(catalog);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenney:modular-cave-kit");
  });

  it("returns an empty array (never throws) for a completely malformed catalog", () => {
    expect(validateKenneyCatalog(null)).toEqual([]);
    expect(validateKenneyCatalog(undefined)).toEqual([]);
    expect(validateKenneyCatalog("not an array")).toEqual([]);
    expect(validateKenneyCatalog({ not: "an array" })).toEqual([]);
    expect(validateKenneyCatalog([{ garbage: 1 }, { more: "garbage" }])).toEqual([]);
  });
});

describe("isValidKenneyCatalogManifest", () => {
  it("accepts a well-formed manifest", () => {
    expect(
      isValidKenneyCatalogManifest({
        sourceUrl: "https://kenney.nl/feed",
        generatedAt: "2026-07-21T00:00:00.000Z",
        catalogVersion: "abc123",
        count: 25,
        skipped: 0,
        license: "CC0",
        scope: "latest releases only",
      }),
    ).toBe(true);
  });

  it("rejects a malformed manifest", () => {
    expect(isValidKenneyCatalogManifest(null)).toBe(false);
    expect(isValidKenneyCatalogManifest({ sourceUrl: "https://kenney.nl/feed" })).toBe(false);
  });
});
