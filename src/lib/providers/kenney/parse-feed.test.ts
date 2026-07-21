import { describe, expect, it } from "vitest";
import { parseKenneyFeedXml } from "./parse-feed";
import {
  feedXml,
  MALFORMED_BAD_DATE,
  MALFORMED_MISSING_ENCLOSURE,
  MALFORMED_MISSING_TITLE,
  MALFORMED_UNTRUSTED_IMAGE_HOST,
  MALFORMED_UNTRUSTED_LINK,
  VALID_ITEM_2D,
  VALID_ITEM_3D,
  VALID_ITEM_TEXTURES,
} from "./__fixtures__/sample-feed";

describe("parseKenneyFeedXml", () => {
  it("parses every well-formed item in the feed", () => {
    const result = parseKenneyFeedXml(feedXml(VALID_ITEM_3D, VALID_ITEM_2D, VALID_ITEM_TEXTURES));

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.title).sort()).toEqual(
      ["Modular Cave Kit", "Input Prompts", "Skyboxes"].sort(),
    );
  });

  it("extracts real fields correctly from a single item", () => {
    const result = parseKenneyFeedXml(feedXml(VALID_ITEM_3D));
    const item = result.items[0];

    expect(item.title).toBe("Modular Cave Kit");
    expect(item.link).toBe("https://kenney.nl/assets/modular-cave-kit");
    expect(item.category).toBe("3D");
    expect(item.imageUrl).toBe("https://kenney.nl/media/pages/assets/modular-cave-kit/98586b397d-1783667086/preview.png");
    expect(item.description).toContain("tagged as: tiles, modular, cave");
  });

  it("skips malformed/untrusted entries instead of throwing, and still returns the valid ones", () => {
    const result = parseKenneyFeedXml(
      feedXml(
        VALID_ITEM_3D,
        MALFORMED_MISSING_ENCLOSURE,
        MALFORMED_UNTRUSTED_LINK,
        MALFORMED_UNTRUSTED_IMAGE_HOST,
        MALFORMED_BAD_DATE,
        MALFORMED_MISSING_TITLE,
      ),
    );

    expect(result.totalUpstream).toBe(6);
    expect(result.skipped).toBe(5);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Modular Cave Kit");
  });

  it("never throws for a feed with no items, or garbage input", () => {
    expect(() => parseKenneyFeedXml(feedXml())).not.toThrow();
    expect(parseKenneyFeedXml(feedXml()).items).toEqual([]);
    expect(() => parseKenneyFeedXml("not xml at all")).not.toThrow();
    expect(parseKenneyFeedXml("not xml at all").items).toEqual([]);
  });
});
