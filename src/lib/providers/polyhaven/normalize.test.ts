import { describe, expect, it } from "vitest";
import { parsePolyHavenRawAsset } from "./raw-types";
import { normalizePolyHavenAsset } from "./normalize";
import { HDRI_FIXTURE, MODEL_FIXTURE, MODEL_FIXTURE_UNKNOWN_CATEGORY, TEXTURE_FIXTURE } from "./__fixtures__/sample-assets";

function normalize(slug: string, fixture: unknown) {
  const parsed = parsePolyHavenRawAsset(fixture);
  if (!parsed) throw new Error("fixture failed to parse — test setup is broken");
  return normalizePolyHavenAsset(slug, parsed);
}

describe("normalizePolyHavenAsset", () => {
  it("maps an HDRI to a 3D asset with assetType HDRI", () => {
    const asset = normalize("aarfontein_dirt_road", HDRI_FIXTURE);
    expect(asset.category).toBe("3D");
    expect(asset.assetType).toBe("HDRI");
  });

  it("maps a texture to the 'both' dimension with assetType Texture", () => {
    const asset = normalize("aerial_asphalt_01", TEXTURE_FIXTURE);
    expect(asset.category).toBe("both");
    expect(asset.assetType).toBe("Texture");
    expect(asset.dimensionsMm).toEqual([30000, 30000]);
  });

  it("maps a model to a 3D asset with a category-inferred assetType", () => {
    const asset = normalize("ArmChair_01", MODEL_FIXTURE);
    expect(asset.category).toBe("3D");
    expect(asset.assetType).toBe("Prop"); // "furniture"/"seating" -> Prop
    expect(asset.polycount).toBe(5626);
    expect(asset.hasLods).toBe(true);
  });

  it("falls back to Prop for a model with an unrecognized category", () => {
    const asset = normalize("unknown_model", MODEL_FIXTURE_UNKNOWN_CATEGORY);
    expect(asset.assetType).toBe("Prop");
  });

  it("always sets pricing free and license CC0", () => {
    for (const [slug, fixture] of [
      ["a", HDRI_FIXTURE],
      ["b", TEXTURE_FIXTURE],
      ["c", MODEL_FIXTURE],
    ] as const) {
      const asset = normalize(slug, fixture);
      expect(asset.pricing).toEqual({ model: "free" });
      expect(asset.license).toBe("CC0");
      expect(asset.source).toBe("polyhaven");
    }
  });

  it("preserves the source slug in both the id and externalUrl", () => {
    const asset = normalize("ArmChair_01", MODEL_FIXTURE);
    expect(asset.id).toBe("polyhaven:ArmChair_01");
    expect(asset.externalUrl).toBe("https://polyhaven.com/a/ArmChair_01");
  });

  it("does not invent file formats", () => {
    const asset = normalize("ArmChair_01", MODEL_FIXTURE);
    expect(asset.formats).toBeUndefined();
  });

  it("carries through authors, download count, and resolution when available", () => {
    const asset = normalize("aerial_asphalt_01", TEXTURE_FIXTURE);
    expect(asset.authors).toEqual(["Rob Tuytel"]);
    expect(asset.downloadCount).toBe(144299);
    expect(asset.resolution).toBe("8192×8192");
  });
});
