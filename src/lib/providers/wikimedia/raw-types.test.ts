import { describe, expect, it } from "vitest";
import { extractPages, isWikimediaQueryResponse, parseWikimediaRawPage } from "./raw-types";
import {
  CC0_PAGE,
  CC_BY_PAGE,
  MALFORMED_NOT_A_FILE,
  MALFORMED_NO_IMAGEINFO,
  MALFORMED_UNTRUSTED_HOST,
  NOT_AN_OBJECT,
} from "./__fixtures__/sample-pages";

describe("parseWikimediaRawPage", () => {
  it("parses a well-formed CC BY page", () => {
    const raw = parseWikimediaRawPage(CC_BY_PAGE);
    expect(raw?.pageid).toBe(112631640);
  });

  it("parses a well-formed CC0 page", () => {
    const raw = parseWikimediaRawPage(CC0_PAGE);
    expect(raw?.pageid).toBe(55000111);
  });

  it("rejects a page missing imageinfo", () => {
    expect(parseWikimediaRawPage(MALFORMED_NO_IMAGEINFO)).toBeNull();
  });

  it("rejects untrusted thumbnail/full-image hosts", () => {
    expect(parseWikimediaRawPage(MALFORMED_UNTRUSTED_HOST)).toBeNull();
  });

  it("rejects a non-File-namespace title", () => {
    expect(parseWikimediaRawPage(MALFORMED_NOT_A_FILE)).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseWikimediaRawPage(NOT_AN_OBJECT)).toBeNull();
    expect(parseWikimediaRawPage(null)).toBeNull();
  });
});

describe("isWikimediaQueryResponse / extractPages", () => {
  it("accepts a response with query.pages (formatversion=2 array shape) and extracts its values", () => {
    const response = { query: { pages: [CC_BY_PAGE, CC0_PAGE] } };
    expect(isWikimediaQueryResponse(response)).toBe(true);
    expect(extractPages(response)).toHaveLength(2);
  });

  it("rejects a response missing query.pages", () => {
    expect(isWikimediaQueryResponse({ query: {} })).toBe(false);
    expect(isWikimediaQueryResponse(null)).toBe(false);
  });

  it("rejects the legacy formatversion=1 object-keyed shape (never requested by this app)", () => {
    expect(isWikimediaQueryResponse({ query: { pages: { "1": CC_BY_PAGE } } })).toBe(false);
  });
});
