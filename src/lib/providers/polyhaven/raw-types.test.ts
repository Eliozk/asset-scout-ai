import { describe, expect, it } from "vitest";
import { parsePolyHavenRawAsset } from "./raw-types";
import {
  HDRI_FIXTURE,
  MALFORMED_MISSING_THUMBNAIL,
  MALFORMED_NSFW,
  MALFORMED_UNKNOWN_TYPE,
  MALFORMED_WRONG_THUMBNAIL_HOST,
  MODEL_FIXTURE,
  NOT_AN_OBJECT,
  TEXTURE_FIXTURE,
} from "./__fixtures__/sample-assets";

describe("parsePolyHavenRawAsset", () => {
  it("accepts a valid HDRI record", () => {
    const parsed = parsePolyHavenRawAsset(HDRI_FIXTURE);
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe(0);
    expect(parsed?.name).toBe("Aarfontein Dirt Road");
  });

  it("accepts a valid texture record", () => {
    const parsed = parsePolyHavenRawAsset(TEXTURE_FIXTURE);
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe(1);
  });

  it("accepts a valid model record", () => {
    const parsed = parsePolyHavenRawAsset(MODEL_FIXTURE);
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe(2);
    expect(parsed?.polycount).toBe(5626);
    expect(parsed?.lods).toBe(true);
  });

  it("rejects a non-object value", () => {
    expect(parsePolyHavenRawAsset(NOT_AN_OBJECT)).toBeNull();
  });

  it("rejects a record missing thumbnail_url", () => {
    expect(parsePolyHavenRawAsset(MALFORMED_MISSING_THUMBNAIL)).toBeNull();
  });

  it("rejects a thumbnail_url that isn't from cdn.polyhaven.com", () => {
    expect(parsePolyHavenRawAsset(MALFORMED_WRONG_THUMBNAIL_HOST)).toBeNull();
  });

  it("rejects an unknown numeric type", () => {
    expect(parsePolyHavenRawAsset(MALFORMED_UNKNOWN_TYPE)).toBeNull();
  });

  it("rejects an asset flagged nsfw", () => {
    expect(parsePolyHavenRawAsset(MALFORMED_NSFW)).toBeNull();
  });
});
