import { describe, expect, it } from "vitest";
import { buildEmbeddingText } from "./embedding-text";

describe("buildEmbeddingText", () => {
  it("concatenates name, description, category, assetType, and tags", () => {
    const text = buildEmbeddingText({
      name: "Dirty Football",
      description: "A worn, scuffed leather football.",
      category: "3D",
      assetType: "Prop",
      tags: ["ball", "sports", "dirty"],
    });

    expect(text).toBe("Dirty Football A worn, scuffed leather football. 3D Prop ball sports dirty");
  });

  it("does not mention engines, formats, or pricing", () => {
    const text = buildEmbeddingText({
      name: "Anti Slip Concrete",
      description: "A rough concrete texture.",
      category: "both",
      assetType: "Texture",
      tags: ["concrete", "weathered"],
    });

    expect(text.toLowerCase()).not.toContain("unity");
    expect(text.toLowerCase()).not.toContain("engine");
    expect(text.toLowerCase()).not.toContain("cc0");
  });

  it("handles assets with no tags", () => {
    const text = buildEmbeddingText({
      name: "Plain Asset",
      description: "No tags here.",
      category: "3D",
      assetType: "HDRI",
      tags: [],
    });

    expect(text).toBe("Plain Asset No tags here. 3D HDRI");
  });
});
