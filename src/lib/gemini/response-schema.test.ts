import { describe, expect, it } from "vitest";
import { ASSET_CATEGORIES, ASSET_STYLES, ASSET_TYPES, ENGINE_COMPATIBILITIES } from "@/domain/asset";
import { GEMINI_SEARCH_INTENT_SCHEMA } from "./response-schema";

describe("GEMINI_SEARCH_INTENT_SCHEMA", () => {
  it("assetTypes enum matches the domain ASSET_TYPES exactly (can never silently drift)", () => {
    expect(GEMINI_SEARCH_INTENT_SCHEMA.properties.assetTypes.items.enum).toEqual([...ASSET_TYPES]);
  });

  it("engines enum matches the domain ENGINE_COMPATIBILITIES exactly", () => {
    expect(GEMINI_SEARCH_INTENT_SCHEMA.properties.engines.items.enum).toEqual([...ENGINE_COMPATIBILITIES]);
  });

  it("styles enum matches the domain ASSET_STYLES exactly", () => {
    expect(GEMINI_SEARCH_INTENT_SCHEMA.properties.styles.items.enum).toEqual([...ASSET_STYLES]);
  });

  it("dimension enum is 'all' plus the domain ASSET_CATEGORIES exactly", () => {
    expect(GEMINI_SEARCH_INTENT_SCHEMA.properties.dimension.enum).toEqual(["all", ...ASSET_CATEGORIES]);
  });

  it("requires every field the app depends on", () => {
    expect(GEMINI_SEARCH_INTENT_SCHEMA.required).toEqual(
      expect.arrayContaining([
        "normalizedQuery",
        "meaningfulKeywords",
        "dimension",
        "assetTypes",
        "engines",
        "styles",
        "platforms",
        "freeOnly",
        "originalLanguage",
        "interpretationSummary",
      ]),
    );
  });
});
