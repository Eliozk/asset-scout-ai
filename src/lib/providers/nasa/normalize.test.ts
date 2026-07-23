import { describe, expect, it } from "vitest";
import { parseNasaRawItem } from "./raw-types";
import { normalizeNasaItem } from "./normalize";
import { REAL_IMAGE_ITEM } from "./__fixtures__/sample-items";

describe("normalizeNasaItem", () => {
  it("normalizes a well-formed image item", () => {
    const raw = parseNasaRawItem(REAL_IMAGE_ITEM);
    const asset = normalizeNasaItem(raw!);

    expect(asset.id).toBe("nasa:PIA07081");
    expect(asset.source).toBe("nasa");
    expect(asset.license).toBe("CC0");
    expect(asset.licenseDetail).toMatch(/not copyrighted|NASA/i);
    expect(asset.externalUrl).toBe("https://images.nasa.gov/details/PIA07081");
    expect(asset.thumbnailUrl).toBe("https://images-assets.nasa.gov/image/PIA07081/PIA07081~thumb.jpg");
    expect(asset.tags).toContain("mars");
    expect(asset.authors).toEqual(["NASA/JPL"]);
  });

  it("falls back to the first available link when no preview/alternate rel is present", () => {
    const raw = parseNasaRawItem({
      ...REAL_IMAGE_ITEM,
      links: [{ href: "https://images-assets.nasa.gov/image/x/x~orig.jpg", rel: "canonical" }],
    });
    const asset = normalizeNasaItem(raw!);
    expect(asset.thumbnailUrl).toBe("https://images-assets.nasa.gov/image/x/x~orig.jpg");
  });
});
