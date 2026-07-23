import { describe, expect, it } from "vitest";
import { isOpenverseSearchResponse, parseOpenverseRawResult } from "./raw-types";
import {
  CC0_RESULT,
  CC_BY_SA_RESULT,
  MALFORMED_MISSING_THUMBNAIL,
  MALFORMED_UNTRUSTED_THUMBNAIL_HOST,
  MATURE_RESULT,
  NOT_AN_OBJECT,
} from "./__fixtures__/sample-results";

describe("parseOpenverseRawResult", () => {
  it("parses a well-formed CC BY-SA result", () => {
    const raw = parseOpenverseRawResult(CC_BY_SA_RESULT);
    expect(raw?.id).toBe("4c9447af-dc33-4d64-b4ad-127c5b62597c");
  });

  it("parses a well-formed CC0 result", () => {
    const raw = parseOpenverseRawResult(CC0_RESULT);
    expect(raw?.license).toBe("cc0");
  });

  it("rejects mature-flagged content", () => {
    expect(parseOpenverseRawResult(MATURE_RESULT)).toBeNull();
  });

  it("rejects a missing thumbnail", () => {
    expect(parseOpenverseRawResult(MALFORMED_MISSING_THUMBNAIL)).toBeNull();
  });

  it("rejects an untrusted thumbnail host", () => {
    expect(parseOpenverseRawResult(MALFORMED_UNTRUSTED_THUMBNAIL_HOST)).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseOpenverseRawResult(NOT_AN_OBJECT)).toBeNull();
    expect(parseOpenverseRawResult(null)).toBeNull();
  });
});

describe("isOpenverseSearchResponse", () => {
  it("accepts a response with a results array", () => {
    expect(isOpenverseSearchResponse({ results: [] })).toBe(true);
  });

  it("rejects a response missing results", () => {
    expect(isOpenverseSearchResponse({ notResults: [] })).toBe(false);
    expect(isOpenverseSearchResponse(null)).toBe(false);
  });
});
