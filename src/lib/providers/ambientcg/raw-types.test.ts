import { describe, expect, it } from "vitest";
import { isAmbientCGSearchResponse, parseAmbientCGRawAsset } from "./raw-types";
import {
  MALFORMED_MISSING_PREVIEW,
  MALFORMED_UNTRUSTED_IMAGE_HOST,
  MALFORMED_UNTRUSTED_SHORTLINK,
  NOT_AN_OBJECT,
  REAL_HDRI_ASSET,
  REAL_MATERIAL_ASSET,
  UNSUPPORTED_DATA_TYPE_ASSET,
} from "./__fixtures__/sample-assets";

describe("parseAmbientCGRawAsset", () => {
  it("parses a well-formed Material asset", () => {
    const raw = parseAmbientCGRawAsset(REAL_MATERIAL_ASSET);
    expect(raw?.assetId).toBe("Wood095");
    expect(raw?.dataType).toBe("Material");
  });

  it("parses a well-formed HDRI asset", () => {
    const raw = parseAmbientCGRawAsset(REAL_HDRI_ASSET);
    expect(raw?.assetId).toBe("DaySkyHDRI065B");
    expect(raw?.dataType).toBe("HDRI");
  });

  it("rejects a dataType this app has no mapping for", () => {
    expect(parseAmbientCGRawAsset(UNSUPPORTED_DATA_TYPE_ASSET)).toBeNull();
  });

  it("rejects a missing previewImage", () => {
    expect(parseAmbientCGRawAsset(MALFORMED_MISSING_PREVIEW)).toBeNull();
  });

  it("rejects an untrusted shortLink host", () => {
    expect(parseAmbientCGRawAsset(MALFORMED_UNTRUSTED_SHORTLINK)).toBeNull();
  });

  it("rejects an untrusted preview image host", () => {
    expect(parseAmbientCGRawAsset(MALFORMED_UNTRUSTED_IMAGE_HOST)).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseAmbientCGRawAsset(NOT_AN_OBJECT)).toBeNull();
    expect(parseAmbientCGRawAsset(null)).toBeNull();
  });
});

describe("isAmbientCGSearchResponse", () => {
  it("accepts a response with a foundAssets array", () => {
    expect(isAmbientCGSearchResponse({ foundAssets: [] })).toBe(true);
  });

  it("rejects a response missing foundAssets", () => {
    expect(isAmbientCGSearchResponse({ notFoundAssets: [] })).toBe(false);
    expect(isAmbientCGSearchResponse(null)).toBe(false);
  });
});
