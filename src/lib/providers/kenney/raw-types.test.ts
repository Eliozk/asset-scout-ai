import { describe, expect, it } from "vitest";
import { extractSlugFromLink, extractTagsFromDescription, parseKenneyRawFeedItem } from "./raw-types";

describe("parseKenneyRawFeedItem", () => {
  const validFields = {
    title: "Modular Cave Kit",
    link: "https://kenney.nl/assets/modular-cave-kit",
    guid: "modular-cave-kit",
    pubDate: "Fri, 10 Jul 2026 00:00:00 +0000",
    category: "3D",
    imageUrl: "https://kenney.nl/media/pages/assets/modular-cave-kit/x/preview.png",
    description: "This 3D pack contains 40 files. It is tagged as: tiles, modular, cave",
  };

  it("accepts a fully valid field set", () => {
    expect(parseKenneyRawFeedItem(validFields)).not.toBeNull();
  });

  it("rejects a missing/empty title", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, title: null })).toBeNull();
    expect(parseKenneyRawFeedItem({ ...validFields, title: "  " })).toBeNull();
  });

  it("rejects a link not on the trusted kenney.nl/assets/ prefix", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, link: "https://evil.example.com/assets/x" })).toBeNull();
    expect(parseKenneyRawFeedItem({ ...validFields, link: null })).toBeNull();
  });

  it("rejects an image url not on the trusted kenney.nl/media/ prefix", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, imageUrl: "https://evil.example.com/preview.png" })).toBeNull();
    expect(parseKenneyRawFeedItem({ ...validFields, imageUrl: null })).toBeNull();
  });

  it("rejects an unparseable pubDate", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, pubDate: "not-a-date" })).toBeNull();
    expect(parseKenneyRawFeedItem({ ...validFields, pubDate: null })).toBeNull();
  });

  it("rejects a missing category or guid", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, category: null })).toBeNull();
    expect(parseKenneyRawFeedItem({ ...validFields, guid: null })).toBeNull();
  });

  it("rejects a non-string description", () => {
    expect(parseKenneyRawFeedItem({ ...validFields, description: null })).toBeNull();
  });
});

describe("extractTagsFromDescription", () => {
  it("extracts the comma-separated tag list from the fixed 'tagged as' phrase", () => {
    const tags = extractTagsFromDescription("This 3D pack contains 40 files. It is tagged as: tiles, modular, cave");
    expect(tags).toEqual(["tiles", "modular", "cave"]);
  });

  it("returns an empty array (never throws) when the phrase is absent", () => {
    expect(extractTagsFromDescription("No tag sentence here at all.")).toEqual([]);
  });

  it("lowercases and trims each tag", () => {
    expect(extractTagsFromDescription("tagged as:  Car ,  VEHICLE ")).toEqual(["car", "vehicle"]);
  });
});

describe("extractSlugFromLink", () => {
  it("extracts the slug from a trusted asset link", () => {
    expect(extractSlugFromLink("https://kenney.nl/assets/modular-cave-kit")).toBe("modular-cave-kit");
  });

  it("returns null for an untrusted host", () => {
    expect(extractSlugFromLink("https://evil.example.com/assets/x")).toBeNull();
  });
});
