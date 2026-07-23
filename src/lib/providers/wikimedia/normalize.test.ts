import { describe, expect, it } from "vitest";
import { parseWikimediaRawPage } from "./raw-types";
import { normalizeWikimediaPage } from "./normalize";
import { CC0_PAGE, CC_BY_PAGE, NO_LICENSE_METADATA_PAGE } from "./__fixtures__/sample-pages";

describe("normalizeWikimediaPage", () => {
  it("maps a plain CC BY license to the CC-BY enum with the exact detail preserved", () => {
    const raw = parseWikimediaRawPage(CC_BY_PAGE);
    const asset = normalizeWikimediaPage(raw!);

    expect(asset.id).toBe("wikimedia:112631640");
    expect(asset.license).toBe("CC-BY");
    expect(asset.licenseDetail).toBe("CC BY 2.0");
    expect(asset.name).toBe("Albion Hospitaller Medieval Sword 1 (6092737619) (II)");
    expect(asset.category).toBe("2D");
    expect(asset.assetType).toBe("Texture");
    expect(asset.externalUrl).toBe(CC_BY_PAGE.imageinfo[0].descriptionurl);
    expect(asset.thumbnailUrl).toBe(CC_BY_PAGE.imageinfo[0].thumburl);
    // HTML in the raw Artist field must be stripped to plain text, never rendered as markup.
    expect(asset.authors).toEqual(["Søren Niedziella"]);
  });

  it("maps cc0-1.0 to the CC0 enum", () => {
    const raw = parseWikimediaRawPage(CC0_PAGE);
    const asset = normalizeWikimediaPage(raw!);
    expect(asset.license).toBe("CC0");
  });

  it("labels a page with no license metadata as Custom/unknown, never as free-and-clear", () => {
    const raw = parseWikimediaRawPage(NO_LICENSE_METADATA_PAGE);
    const asset = normalizeWikimediaPage(raw!);
    expect(asset.license).toBe("Custom");
    expect(asset.licenseDetail).toMatch(/unknown|unverified/i);
  });
});
