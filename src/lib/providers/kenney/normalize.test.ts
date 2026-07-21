import { describe, expect, it } from "vitest";
import { inferAssetType, inferStyle, mapDimension, normalizeKenneyItem } from "./normalize";
import type { KenneyRawFeedItem } from "./raw-types";

function makeRaw(overrides: Partial<KenneyRawFeedItem> = {}): KenneyRawFeedItem {
  return {
    title: "Modular Cave Kit",
    link: "https://kenney.nl/assets/modular-cave-kit",
    guid: "modular-cave-kit",
    pubDate: "Fri, 10 Jul 2026 00:00:00 +0000",
    category: "3D",
    imageUrl: "https://kenney.nl/media/pages/assets/modular-cave-kit/x/preview.png",
    description: "This 3D pack contains 40 files. It is tagged as: tiles, modular, cave",
    ...overrides,
  };
}

describe("normalizeKenneyItem", () => {
  it("always marks the source as kenney and the license as CC0", () => {
    const asset = normalizeKenneyItem(makeRaw());
    expect(asset.source).toBe("kenney");
    expect(asset.license).toBe("CC0");
    expect(asset.licenseDetail).toBeUndefined();
  });

  it("always marks pricing as free", () => {
    expect(normalizeKenneyItem(makeRaw()).pricing).toEqual({ model: "free" });
  });

  it("preserves the slug in the id and the real link as externalUrl", () => {
    const asset = normalizeKenneyItem(makeRaw());
    expect(asset.id).toBe("kenney:modular-cave-kit");
    expect(asset.externalUrl).toBe("https://kenney.nl/assets/modular-cave-kit");
  });

  it("carries through the real preview image url", () => {
    const asset = normalizeKenneyItem(makeRaw());
    expect(asset.thumbnailUrl).toBe("https://kenney.nl/media/pages/assets/modular-cave-kit/x/preview.png");
  });

  it("extracts real tags from the description and lowercases them", () => {
    const asset = normalizeKenneyItem(makeRaw({ description: "This 3D pack contains 3 files. It is tagged as: Car, Vehicle" }));
    expect(asset.tags).toEqual(["car", "vehicle"]);
  });

  it("formats addedAt as a plain date string from the real pubDate", () => {
    const asset = normalizeKenneyItem(makeRaw({ pubDate: "Fri, 10 Jul 2026 00:00:00 +0000" }));
    expect(asset.addedAt).toBe("2026-07-10");
  });

  it("does not invent engines, formats, resolution, or dimensions", () => {
    const asset = normalizeKenneyItem(makeRaw());
    expect(asset.engines).toEqual(["Engine-agnostic"]);
    expect(asset.formats).toBeUndefined();
    expect(asset.resolution).toBeUndefined();
    expect(asset.dimensionsMm).toBeUndefined();
  });
});

describe("mapDimension", () => {
  it("maps 3D and 2D categories directly", () => {
    expect(mapDimension("3D")).toBe("3D");
    expect(mapDimension("2D")).toBe("2D");
  });

  it("maps Textures to 'both', matching the existing texture-dimension convention", () => {
    expect(mapDimension("Textures")).toBe("both");
  });

  it("falls back to 'both' for an unrecognized category rather than excluding the asset", () => {
    expect(mapDimension("Something New")).toBe("both");
  });
});

describe("inferAssetType", () => {
  it("infers Vehicle from a real tag", () => {
    expect(inferAssetType("3D", ["car", "vehicle"])).toBe("Vehicle");
  });

  it("infers Weapon from a real tag", () => {
    expect(inferAssetType("3D", ["blaster", "weapon"])).toBe("Weapon");
  });

  it("infers UI from 2D input-related tags", () => {
    expect(inferAssetType("2D", ["input", "prompt", "gamepad"])).toBe("UI");
  });

  it("infers Environment from real environment-flavored tags (cave, skybox)", () => {
    expect(inferAssetType("3D", ["tiles", "modular", "cave"])).toBe("Environment");
    expect(inferAssetType("Textures", ["skybox", "sky"])).toBe("Environment");
  });

  it("falls back to Texture for the Textures category when no tag matches", () => {
    expect(inferAssetType("Textures", ["stars", "clouds"])).toBe("Texture");
  });

  it("falls back to Prop for any other category when no tag matches", () => {
    expect(inferAssetType("3D", ["totally-unrecognized-tag"])).toBe("Prop");
  });
});

describe("inferStyle", () => {
  it("infers Low-poly for the 3D category by default", () => {
    expect(inferStyle("3D", ["cave"])).toBe("Low-poly");
  });

  it("infers Cartoon for the 2D category by default", () => {
    expect(inferStyle("2D", ["input"])).toBe("Cartoon");
  });

  it("infers Pixel-art when a pixel tag is present, regardless of category", () => {
    expect(inferStyle("2D", ["pixel", "sprite"])).toBe("Pixel-art");
  });

  it("falls back to Realistic for Textures", () => {
    expect(inferStyle("Textures", ["skybox"])).toBe("Realistic");
  });
});
