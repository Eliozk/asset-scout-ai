import { describe, expect, it } from "vitest";
import { AmbientCGUpstreamError, parseAndNormalizeSearch } from "./fetch-assets";
import {
  MALFORMED_MISSING_PREVIEW,
  REAL_HDRI_ASSET,
  REAL_MATERIAL_ASSET,
  UNSUPPORTED_DATA_TYPE_ASSET,
} from "./__fixtures__/sample-assets";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed result in the response", () => {
    const result = parseAndNormalizeSearch({ foundAssets: [REAL_MATERIAL_ASSET, REAL_HDRI_ASSET] });

    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(2);
    expect(result.assets.map((a) => a.id).sort()).toEqual(
      ["ambientcg:Wood095", "ambientcg:DaySkyHDRI065B"].sort(),
    );
  });

  it("skips malformed/unsupported entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch({
      foundAssets: [REAL_MATERIAL_ASSET, MALFORMED_MISSING_PREVIEW, UNSUPPORTED_DATA_TYPE_ASSET],
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(2);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("ambientcg:Wood095");
  });

  it("throws a controlled AmbientCGUpstreamError for a response with no foundAssets array", () => {
    expect(() => parseAndNormalizeSearch({ notFoundAssets: [] })).toThrow(AmbientCGUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(AmbientCGUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(AmbientCGUpstreamError);
  });
});
