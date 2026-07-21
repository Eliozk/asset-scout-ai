import { describe, expect, it } from "vitest";
import { parsePixabayRawHit } from "./raw-types";
import { normalizePixabayHit } from "./normalize";
import { ILLUSTRATION_HIT, PHOTO_HIT, VECTOR_HIT } from "./__fixtures__/sample-hits";

function normalize(fixture: unknown) {
  const parsed = parsePixabayRawHit(fixture);
  if (!parsed) throw new Error("fixture failed to parse — test setup is broken");
  return normalizePixabayHit(parsed);
}

describe("normalizePixabayHit", () => {
  it("always marks license as Royalty-Free with the exact Pixabay license detail", () => {
    const asset = normalize(PHOTO_HIT);
    expect(asset.license).toBe("Royalty-Free");
    expect(asset.licenseDetail).toBe("Pixabay Content License");
  });

  it("always marks pricing as free and category as 2D (never 'both', never 3D)", () => {
    const asset = normalize(PHOTO_HIT);
    expect(asset.pricing).toEqual({ model: "free" });
    expect(asset.category).toBe("2D");
  });

  it("always maps assetType to Texture — never Character/Vehicle/Weapon from a stock-photo tag", () => {
    const carPhoto = { ...PHOTO_HIT, tags: "car, vehicle, red" };
    expect(normalize(carPhoto).assetType).toBe("Texture");
  });

  it("infers Realistic style for photos and Stylized for illustrations/vectors", () => {
    expect(normalize(PHOTO_HIT).style).toBe("Realistic");
    expect(normalize(ILLUSTRATION_HIT).style).toBe("Stylized");
    expect(normalize(VECTOR_HIT).style).toBe("Stylized");
  });

  it("uses the real tags string as the name, since Pixabay has no title field", () => {
    expect(normalize(PHOTO_HIT).name).toBe("blossom, bloom, flower");
  });

  it("preserves the real id in the id field and the real pageURL as externalUrl", () => {
    const asset = normalize(PHOTO_HIT);
    expect(asset.id).toBe("pixabay:195893");
    expect(asset.externalUrl).toBe("https://pixabay.com/en/blossom-bloom-flower-195893/");
  });

  it("uses webformatURL as the thumbnail, not a gated full-resolution field", () => {
    expect(normalize(PHOTO_HIT).thumbnailUrl).toBe("https://pixabay.com/get/35bbf209e13e39d2_640.jpg");
  });

  it("carries through the real author and download count", () => {
    const asset = normalize(PHOTO_HIT);
    expect(asset.authors).toEqual(["Josch13"]);
    expect(asset.downloadCount).toBe(6439);
  });

  it("formats resolution from real imageWidth/imageHeight", () => {
    expect(normalize(PHOTO_HIT).resolution).toBe("4000×2250");
  });

  it("falls back to the epoch sentinel for addedAt — Pixabay provides no date field at all", () => {
    expect(normalize(PHOTO_HIT).addedAt).toBe("1970-01-01");
  });

  it("does not invent formats, engines beyond agnostic, dimensionsMm, or polycount", () => {
    const asset = normalize(PHOTO_HIT);
    expect(asset.formats).toBeUndefined();
    expect(asset.engines).toEqual(["Engine-agnostic"]);
    expect(asset.dimensionsMm).toBeUndefined();
    expect(asset.polycount).toBeUndefined();
  });

  it("falls back to a generated name only when tags are empty", () => {
    const parsed = parsePixabayRawHit({ ...PHOTO_HIT, tags: "" });
    const asset = normalizePixabayHit(parsed!);
    expect(asset.name).toBe("Pixabay photo #195893");
  });
});
