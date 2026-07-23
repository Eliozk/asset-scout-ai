import { describe, expect, it } from "vitest";
import { parseAmbientCGRawAsset } from "./raw-types";
import { normalizeAmbientCGAsset } from "./normalize";
import { REAL_HDRI_ASSET, REAL_MATERIAL_ASSET } from "./__fixtures__/sample-assets";

describe("normalizeAmbientCGAsset", () => {
  it("normalizes a Material into a Texture asset usable on both 2D and 3D", () => {
    const raw = parseAmbientCGRawAsset(REAL_MATERIAL_ASSET);
    const asset = normalizeAmbientCGAsset(raw!);

    expect(asset.id).toBe("ambientcg:Wood095");
    expect(asset.source).toBe("ambientcg");
    expect(asset.assetType).toBe("Texture");
    expect(asset.category).toBe("both");
    expect(asset.license).toBe("CC0");
    expect(asset.pricing).toEqual({ model: "free" });
    expect(asset.externalUrl).toBe("https://ambientcg.com/a/Wood095");
    expect(asset.thumbnailUrl).toBe(REAL_MATERIAL_ASSET.previewImage["512-PNG"]);
    expect(asset.tags).toContain("wood");
  });

  it("normalizes an HDRI into an HDRI asset scoped to 3D", () => {
    const raw = parseAmbientCGRawAsset(REAL_HDRI_ASSET);
    const asset = normalizeAmbientCGAsset(raw!);

    expect(asset.id).toBe("ambientcg:DaySkyHDRI065B");
    expect(asset.assetType).toBe("HDRI");
    expect(asset.category).toBe("3D");
  });

  it("falls back to any available preview image when the preferred sizes are absent", () => {
    const raw = parseAmbientCGRawAsset({
      ...REAL_MATERIAL_ASSET,
      previewImage: { "2048-WEBP": "https://acg-media.struffelproductions.com/file/x/2048.webp" },
    });
    const asset = normalizeAmbientCGAsset(raw!);
    expect(asset.thumbnailUrl).toBe("https://acg-media.struffelproductions.com/file/x/2048.webp");
  });
});
