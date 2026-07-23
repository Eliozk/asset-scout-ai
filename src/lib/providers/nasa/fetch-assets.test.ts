import { describe, expect, it } from "vitest";
import { NasaUpstreamError, parseAndNormalizeSearch } from "./fetch-assets";
import { MALFORMED_NO_LINKS, REAL_IMAGE_ITEM, VIDEO_ITEM } from "./__fixtures__/sample-items";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed image item in the response", () => {
    const result = parseAndNormalizeSearch({ collection: { items: [REAL_IMAGE_ITEM] } });

    expect(result.totalUpstream).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("nasa:PIA07081");
  });

  it("skips non-image/malformed entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch({
      collection: { items: [REAL_IMAGE_ITEM, VIDEO_ITEM, MALFORMED_NO_LINKS] },
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(2);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("nasa:PIA07081");
  });

  it("throws a controlled NasaUpstreamError for a response with no collection.items", () => {
    expect(() => parseAndNormalizeSearch({ collection: {} })).toThrow(NasaUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(NasaUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(NasaUpstreamError);
  });
});
