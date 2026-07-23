import { describe, expect, it } from "vitest";
import { parseAndNormalizeSearch, WikimediaUpstreamError } from "./fetch-assets";
import { CC0_PAGE, CC_BY_PAGE, MALFORMED_NO_IMAGEINFO } from "./__fixtures__/sample-pages";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed page in query.pages", () => {
    const result = parseAndNormalizeSearch({ query: { pages: [CC_BY_PAGE, CC0_PAGE] } });

    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(2);
    expect(result.assets.map((a) => a.id).sort()).toEqual(["wikimedia:112631640", "wikimedia:55000111"].sort());
  });

  it("skips malformed entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch({ query: { pages: [CC_BY_PAGE, MALFORMED_NO_IMAGEINFO] } });

    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("wikimedia:112631640");
  });

  it("throws a controlled WikimediaUpstreamError for a response with no query.pages", () => {
    expect(() => parseAndNormalizeSearch({ query: {} })).toThrow(WikimediaUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(WikimediaUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(WikimediaUpstreamError);
  });
});
