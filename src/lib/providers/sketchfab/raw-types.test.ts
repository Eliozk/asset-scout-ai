import { describe, expect, it } from "vitest";
import { parseSketchfabRawModel } from "./raw-types";
import {
  AGE_RESTRICTED_MODEL,
  DOWNLOADABLE_CC_BY_MODEL,
  MALFORMED_MISSING_THUMBNAILS,
  MALFORMED_UNTRUSTED_THUMBNAIL_HOST,
  MALFORMED_UNTRUSTED_VIEWER_URL,
  NOT_AN_OBJECT,
  NULL_LICENSE_NON_DOWNLOADABLE_MODEL,
  SINGLE_MODEL_LOOKUP_SHAPE,
} from "./__fixtures__/sample-models";

describe("parseSketchfabRawModel", () => {
  it("accepts a valid downloadable, CC-licensed model", () => {
    const parsed = parseSketchfabRawModel(DOWNLOADABLE_CC_BY_MODEL);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe("The Wizard's Chair");
    expect(parsed?.isDownloadable).toBe(true);
    expect(parsed?.license?.label).toBe("CC Attribution-NonCommercial-NoDerivs");
    expect(parsed?.archiveFormats.sort()).toEqual(["glb", "gltf", "source", "usdz"].sort());
  });

  it("accepts a valid model with a null license and no archives", () => {
    const parsed = parseSketchfabRawModel(NULL_LICENSE_NON_DOWNLOADABLE_MODEL);
    expect(parsed).not.toBeNull();
    expect(parsed?.license).toBeNull();
    expect(parsed?.archiveFormats).toEqual([]);
    expect(parsed?.isDownloadable).toBe(false);
  });

  it("rejects an age-restricted model", () => {
    expect(parseSketchfabRawModel(AGE_RESTRICTED_MODEL)).toBeNull();
  });

  it("rejects a non-object value", () => {
    expect(parseSketchfabRawModel(NOT_AN_OBJECT)).toBeNull();
  });

  it("rejects a model missing thumbnails", () => {
    expect(parseSketchfabRawModel(MALFORMED_MISSING_THUMBNAILS)).toBeNull();
  });

  it("rejects a thumbnail that isn't from media.sketchfab.com", () => {
    expect(parseSketchfabRawModel(MALFORMED_UNTRUSTED_THUMBNAIL_HOST)).toBeNull();
  });

  it("rejects a viewerUrl that isn't on sketchfab.com", () => {
    expect(parseSketchfabRawModel(MALFORMED_UNTRUSTED_VIEWER_URL)).toBeNull();
  });

  it("accepts the /v3/models/{uid} single-lookup shape, whose license object has no uid field", () => {
    const parsed = parseSketchfabRawModel(SINGLE_MODEL_LOOKUP_SHAPE);
    expect(parsed).not.toBeNull();
    expect(parsed?.license?.label).toBe("CC Attribution-NonCommercial");
    expect(parsed?.license?.uid).toBeUndefined();
  });
});
