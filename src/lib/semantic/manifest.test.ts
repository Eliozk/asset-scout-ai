import { describe, expect, it } from "vitest";
import { parseSemanticManifest } from "./manifest";

const VALID = {
  modelId: "Xenova/all-MiniLM-L6-v2",
  dimensions: 384,
  catalogVersion: "abcd1234",
  generatedAt: "2026-07-21T00:00:00.000Z",
  count: 2,
  assetIds: ["polyhaven:a", "polyhaven:b"],
};

describe("parseSemanticManifest", () => {
  it("accepts a well-formed manifest", () => {
    expect(parseSemanticManifest(VALID)).toEqual(VALID);
  });

  it("rejects a non-object value", () => {
    expect(parseSemanticManifest("not an object")).toBeNull();
    expect(parseSemanticManifest(null)).toBeNull();
    expect(parseSemanticManifest(["array"])).toBeNull();
  });

  it("rejects a missing or empty modelId", () => {
    expect(parseSemanticManifest({ ...VALID, modelId: "" })).toBeNull();
    expect(parseSemanticManifest({ ...VALID, modelId: undefined })).toBeNull();
  });

  it("rejects a non-positive or non-numeric dimensions", () => {
    expect(parseSemanticManifest({ ...VALID, dimensions: 0 })).toBeNull();
    expect(parseSemanticManifest({ ...VALID, dimensions: -384 })).toBeNull();
    expect(parseSemanticManifest({ ...VALID, dimensions: "384" })).toBeNull();
  });

  it("rejects a non-string catalogVersion", () => {
    expect(parseSemanticManifest({ ...VALID, catalogVersion: 1234 })).toBeNull();
  });

  it("rejects a non-array assetIds or an array with non-string entries", () => {
    expect(parseSemanticManifest({ ...VALID, assetIds: "not-an-array" })).toBeNull();
    expect(parseSemanticManifest({ ...VALID, assetIds: ["ok", 5] })).toBeNull();
  });

  it("rejects when assetIds.length does not match count (internal consistency check)", () => {
    expect(parseSemanticManifest({ ...VALID, count: 5 })).toBeNull();
  });
});
