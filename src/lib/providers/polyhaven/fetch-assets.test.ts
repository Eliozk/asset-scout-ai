import { describe, expect, it } from "vitest";
import { parseAndNormalizeCatalog, PolyHavenUpstreamError } from "./fetch-assets";
import {
  HDRI_FIXTURE,
  MALFORMED_MISSING_THUMBNAIL,
  MALFORMED_NSFW,
  MALFORMED_UNKNOWN_TYPE,
  MODEL_FIXTURE,
  TEXTURE_FIXTURE,
} from "./__fixtures__/sample-assets";

describe("parseAndNormalizeCatalog", () => {
  it("normalizes every well-formed entry in the response", () => {
    const result = parseAndNormalizeCatalog({
      aarfontein_dirt_road: HDRI_FIXTURE,
      aerial_asphalt_01: TEXTURE_FIXTURE,
      ArmChair_01: MODEL_FIXTURE,
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(3);
    expect(result.assets.map((a) => a.id).sort()).toEqual(
      ["polyhaven:ArmChair_01", "polyhaven:aarfontein_dirt_road", "polyhaven:aerial_asphalt_01"].sort(),
    );
  });

  it("skips malformed entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeCatalog({
      good_hdri: HDRI_FIXTURE,
      broken_1: MALFORMED_MISSING_THUMBNAIL,
      broken_2: MALFORMED_UNKNOWN_TYPE,
      broken_3: MALFORMED_NSFW,
    });

    expect(result.totalUpstream).toBe(4);
    expect(result.skipped).toBe(3);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("polyhaven:good_hdri");
  });

  it("throws a controlled PolyHavenUpstreamError for a non-dict response", () => {
    expect(() => parseAndNormalizeCatalog(["not", "a", "dict"])).toThrow(PolyHavenUpstreamError);
    expect(() => parseAndNormalizeCatalog(null)).toThrow(PolyHavenUpstreamError);
  });
});
