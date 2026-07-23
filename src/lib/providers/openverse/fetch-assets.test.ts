import { describe, expect, it } from "vitest";
import { OpenverseUpstreamError, parseAndNormalizeSearch } from "./fetch-assets";
import { CC0_RESULT, CC_BY_SA_RESULT, MALFORMED_MISSING_THUMBNAIL, MATURE_RESULT } from "./__fixtures__/sample-results";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed result in the response", () => {
    const result = parseAndNormalizeSearch({ results: [CC_BY_SA_RESULT, CC0_RESULT] });

    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(2);
  });

  it("skips malformed/mature entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch({
      results: [CC_BY_SA_RESULT, MALFORMED_MISSING_THUMBNAIL, MATURE_RESULT],
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(2);
    expect(result.assets).toHaveLength(1);
  });

  it("throws a controlled OpenverseUpstreamError for a response with no results array", () => {
    expect(() => parseAndNormalizeSearch({ notResults: [] })).toThrow(OpenverseUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(OpenverseUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(OpenverseUpstreamError);
  });
});
