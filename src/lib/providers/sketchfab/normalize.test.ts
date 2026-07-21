import { describe, expect, it } from "vitest";
import { parseSketchfabRawModel } from "./raw-types";
import { normalizeSketchfabModel } from "./normalize";
import {
  DOWNLOADABLE_CC_BY_MODEL,
  NULL_LICENSE_NON_DOWNLOADABLE_MODEL,
  SINGLE_MODEL_LOOKUP_SHAPE,
} from "./__fixtures__/sample-models";

function normalize(fixture: unknown) {
  const parsed = parseSketchfabRawModel(fixture);
  if (!parsed) throw new Error("fixture failed to parse — test setup is broken");
  return normalizeSketchfabModel(parsed);
}

describe("normalizeSketchfabModel", () => {
  it("maps a CC Attribution-NonCommercial-NoDerivs model to Custom + exact licenseDetail", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.license).toBe("Custom");
    expect(asset.licenseDetail).toBe("CC Attribution-NonCommercial-NoDerivs");
  });

  it("maps a null license to Custom with no licenseDetail", () => {
    const asset = normalize(NULL_LICENSE_NON_DOWNLOADABLE_MODEL);
    expect(asset.license).toBe("Custom");
    expect(asset.licenseDetail).toBeUndefined();
  });

  it("preserves licenseDetail for the /v3/models/{uid} single-lookup shape (license object has no uid field)", () => {
    const asset = normalize(SINGLE_MODEL_LOOKUP_SHAPE);
    expect(asset.license).toBe("Custom");
    expect(asset.licenseDetail).toBe("CC Attribution-NonCommercial");
  });

  it("always sets category 3D, source sketchfab, and pricing free", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.category).toBe("3D");
    expect(asset.source).toBe("sketchfab");
    expect(asset.pricing).toEqual({ model: "free" });
  });

  it("infers assetType from real category slugs (furniture-home -> Prop)", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.assetType).toBe("Prop");
  });

  it("infers Character for characters-creatures category", () => {
    const asset = normalize(NULL_LICENSE_NON_DOWNLOADABLE_MODEL);
    expect(asset.assetType).toBe("Character");
  });

  it("infers style Stylized from a real tag", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.style).toBe("Stylized");
  });

  it("maps only recognized archive keys to formats, dropping unknown ones (source, usdz)", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.formats?.sort()).toEqual(["GLB", "GLTF"].sort());
  });

  it("omits formats entirely when there are no archives", () => {
    const asset = normalize(NULL_LICENSE_NON_DOWNLOADABLE_MODEL);
    expect(asset.formats).toBeUndefined();
  });

  it("preserves the source uid in the id and uses the real viewer URL as externalUrl", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.id).toBe("sketchfab:9aea3b516d3e4e169710049b32282670");
    expect(asset.externalUrl).toBe("https://sketchfab.com/3d-models/none-9aea3b516d3e4e169710049b32282670");
  });

  it("carries through the real author display name and polycount", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.authors).toEqual(["SilkevdSmissen"]);
    expect(asset.polycount).toBe(999786);
  });

  it("does not invent engines, resolution, or dimensions", () => {
    const asset = normalize(DOWNLOADABLE_CC_BY_MODEL);
    expect(asset.engines).toEqual(["Engine-agnostic"]);
    expect(asset.resolution).toBeUndefined();
    expect(asset.dimensionsMm).toBeUndefined();
  });
});
