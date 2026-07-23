import { describe, expect, it } from "vitest";
import { extractItems, isNasaSearchResponse, parseNasaRawItem } from "./raw-types";
import {
  MALFORMED_NO_LINKS,
  MALFORMED_UNTRUSTED_HOST,
  NOT_AN_OBJECT,
  REAL_IMAGE_ITEM,
  VIDEO_ITEM,
} from "./__fixtures__/sample-items";

describe("parseNasaRawItem", () => {
  it("parses a well-formed image item", () => {
    const raw = parseNasaRawItem(REAL_IMAGE_ITEM);
    expect(raw?.data.nasa_id).toBe("PIA07081");
  });

  it("rejects a non-image media_type", () => {
    expect(parseNasaRawItem(VIDEO_ITEM)).toBeNull();
  });

  it("rejects an item with no links", () => {
    expect(parseNasaRawItem(MALFORMED_NO_LINKS)).toBeNull();
  });

  it("rejects an untrusted link host", () => {
    expect(parseNasaRawItem(MALFORMED_UNTRUSTED_HOST)).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseNasaRawItem(NOT_AN_OBJECT)).toBeNull();
    expect(parseNasaRawItem(null)).toBeNull();
  });
});

describe("isNasaSearchResponse / extractItems", () => {
  it("accepts a response with collection.items and extracts it", () => {
    const response = { collection: { items: [REAL_IMAGE_ITEM] } };
    expect(isNasaSearchResponse(response)).toBe(true);
    expect(extractItems(response)).toHaveLength(1);
  });

  it("rejects a response missing collection.items", () => {
    expect(isNasaSearchResponse({ collection: {} })).toBe(false);
    expect(isNasaSearchResponse(null)).toBe(false);
  });
});
