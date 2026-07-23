import { describe, expect, it } from "vitest";
import { ASSET_SOURCE_IDS } from "@/domain/asset";
import { RESEARCHED_NOT_IMPLEMENTED_SOURCES, REJECTED_SOURCES } from "./researched-sources";

describe("RESEARCHED_NOT_IMPLEMENTED_SOURCES", () => {
  it("has unique, non-empty ids and a non-empty reason for every entry", () => {
    const ids = RESEARCHED_NOT_IMPLEMENTED_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const source of RESEARCHED_NOT_IMPLEMENTED_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.reason.trim()).not.toBe("");
      expect(new URL(source.homepageUrl).protocol).toBe("https:");
    }
  });

  it("never claims a classification of REJECTED (this list is only eligible-but-deferred sources)", () => {
    for (const source of RESEARCHED_NOT_IMPLEMENTED_SOURCES) {
      expect(source.classification).not.toBe("REJECTED");
    }
  });

  it("no entry here is also a real integrated AssetSourceId (never claim something is both deferred and live)", () => {
    for (const source of RESEARCHED_NOT_IMPLEMENTED_SOURCES) {
      expect((ASSET_SOURCE_IDS as readonly string[]).includes(source.id)).toBe(false);
    }
  });
});

describe("REJECTED_SOURCES", () => {
  it("has unique, non-empty ids and a non-empty reason for every entry", () => {
    const ids = REJECTED_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const source of REJECTED_SOURCES) {
      expect(source.id.trim()).not.toBe("");
      expect(source.reason.trim()).not.toBe("");
      expect(new URL(source.homepageUrl).protocol).toBe("https:");
    }
  });

  it("every entry is classified REJECTED", () => {
    for (const source of REJECTED_SOURCES) {
      expect(source.classification).toBe("REJECTED");
    }
  });

  it("no entry here is also a real integrated AssetSourceId", () => {
    for (const source of REJECTED_SOURCES) {
      expect((ASSET_SOURCE_IDS as readonly string[]).includes(source.id)).toBe(false);
    }
  });
});
