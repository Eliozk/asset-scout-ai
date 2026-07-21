import { describe, expect, it } from "vitest";
import { isPixabaySearchResponse, parsePixabayRawHit, splitPixabayTags } from "./raw-types";
import {
  ILLUSTRATION_HIT,
  MALFORMED_MISSING_USER,
  MALFORMED_UNTRUSTED_IMAGE_HOST,
  MALFORMED_UNTRUSTED_PAGE_URL,
  NOT_AN_OBJECT,
  PHOTO_HIT,
  searchResponse,
  VECTOR_HIT,
} from "./__fixtures__/sample-hits";

describe("parsePixabayRawHit", () => {
  it("accepts a valid photo hit", () => {
    const parsed = parsePixabayRawHit(PHOTO_HIT);
    expect(parsed).not.toBeNull();
    expect(parsed?.id).toBe(195893);
    expect(parsed?.type).toBe("photo");
    expect(parsed?.user).toBe("Josch13");
  });

  it("accepts valid illustration and vector hits", () => {
    expect(parsePixabayRawHit(ILLUSTRATION_HIT)?.type).toBe("illustration");
    expect(parsePixabayRawHit(VECTOR_HIT)?.type).toBe("vector");
  });

  it("rejects a non-object value", () => {
    expect(parsePixabayRawHit(NOT_AN_OBJECT)).toBeNull();
    expect(parsePixabayRawHit(null)).toBeNull();
  });

  it("rejects an image URL not on a trusted Pixabay host", () => {
    expect(parsePixabayRawHit(MALFORMED_UNTRUSTED_IMAGE_HOST)).toBeNull();
  });

  it("rejects a pageURL not on pixabay.com", () => {
    expect(parsePixabayRawHit(MALFORMED_UNTRUSTED_PAGE_URL)).toBeNull();
  });

  it("rejects a missing/empty user", () => {
    expect(parsePixabayRawHit(MALFORMED_MISSING_USER)).toBeNull();
  });

  it("never surfaces gated full-resolution fields, even if present in the raw object", () => {
    const withGatedFields = { ...PHOTO_HIT, fullHDURL: "https://pixabay.com/get/x_1920.jpg", imageURL: "https://pixabay.com/get/x.jpg", vectorURL: "https://pixabay.com/get/x.svg" };
    const parsed = parsePixabayRawHit(withGatedFields);
    expect(parsed).not.toHaveProperty("fullHDURL");
    expect(parsed).not.toHaveProperty("imageURL");
    expect(parsed).not.toHaveProperty("vectorURL");
  });
});

describe("isPixabaySearchResponse", () => {
  it("accepts a well-formed search response", () => {
    expect(isPixabaySearchResponse(searchResponse(PHOTO_HIT))).toBe(true);
  });

  it("rejects a response with no hits array", () => {
    expect(isPixabaySearchResponse({ total: 0 })).toBe(false);
    expect(isPixabaySearchResponse(null)).toBe(false);
    expect(isPixabaySearchResponse("not an object")).toBe(false);
  });
});

describe("splitPixabayTags", () => {
  it("splits, trims, and lowercases the comma-separated tag string", () => {
    expect(splitPixabayTags("Blossom, Bloom , flower")).toEqual(["blossom", "bloom", "flower"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(splitPixabayTags("")).toEqual([]);
  });
});
