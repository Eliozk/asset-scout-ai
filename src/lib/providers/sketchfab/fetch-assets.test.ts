import { describe, expect, it } from "vitest";
import { parseAndNormalizeModel, parseAndNormalizeSearch, SketchfabUpstreamError } from "./fetch-assets";
import {
  AGE_RESTRICTED_MODEL,
  DOWNLOADABLE_CC_BY_MODEL,
  MALFORMED_MISSING_THUMBNAILS,
  NOT_AN_OBJECT,
  NULL_LICENSE_NON_DOWNLOADABLE_MODEL,
} from "./__fixtures__/sample-models";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed result in the response", () => {
    const result = parseAndNormalizeSearch({
      results: [DOWNLOADABLE_CC_BY_MODEL, NULL_LICENSE_NON_DOWNLOADABLE_MODEL],
    });

    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(2);
    expect(result.assets.map((a) => a.id).sort()).toEqual(
      ["sketchfab:9aea3b516d3e4e169710049b32282670", "sketchfab:14ec4c0460c64065af1c6fd31f104344"].sort(),
    );
  });

  it("skips malformed/excluded entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch({
      results: [DOWNLOADABLE_CC_BY_MODEL, MALFORMED_MISSING_THUMBNAILS, AGE_RESTRICTED_MODEL],
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(2);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("sketchfab:9aea3b516d3e4e169710049b32282670");
  });

  it("throws a controlled SketchfabUpstreamError for a response with no results array", () => {
    expect(() => parseAndNormalizeSearch({ notResults: [] })).toThrow(SketchfabUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(SketchfabUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(SketchfabUpstreamError);
  });
});

describe("parseAndNormalizeModel", () => {
  it("normalizes a well-formed single-model response (the /v3/models/{uid} shape)", () => {
    const asset = parseAndNormalizeModel(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset?.id).toBe("sketchfab:9aea3b516d3e4e169710049b32282670");
  });

  it("returns null (never throws) for a malformed or excluded model", () => {
    expect(parseAndNormalizeModel(MALFORMED_MISSING_THUMBNAILS)).toBeNull();
    expect(parseAndNormalizeModel(AGE_RESTRICTED_MODEL)).toBeNull();
    expect(parseAndNormalizeModel(NOT_AN_OBJECT)).toBeNull();
    expect(parseAndNormalizeModel(null)).toBeNull();
  });
});
