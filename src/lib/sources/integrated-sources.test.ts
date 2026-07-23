import { describe, expect, it } from "vitest";
import { ASSET_SOURCE_IDS } from "@/domain/asset";
import { AUTHORIZED_INDEXED_CATALOG_SOURCES, LIVE_API_SOURCES } from "./integrated-sources";

describe("LIVE_API_SOURCES", () => {
  it("lists exactly the 7 zero/optional-key live providers wired into search", () => {
    expect(LIVE_API_SOURCES.map((s) => s.id).sort()).toEqual(
      ["ambientcg", "nasa", "openverse", "pixabay", "polyhaven", "sketchfab", "wikimedia"].sort(),
    );
  });

  it("every entry is a real, currently-supported AssetSourceId", () => {
    for (const source of LIVE_API_SOURCES) {
      expect((ASSET_SOURCE_IDS as readonly string[]).includes(source.id)).toBe(true);
    }
  });

  it("every entry has a connectionMode of live-api and a non-empty limitation/attribution", () => {
    for (const source of LIVE_API_SOURCES) {
      expect(source.connectionMode).toBe("live-api");
      expect(source.limitation.trim()).not.toBe("");
      expect(source.attributionNote.trim()).not.toBe("");
      expect(new URL(source.homepageUrl).protocol).toBe("https:");
    }
  });
});

describe("AUTHORIZED_INDEXED_CATALOG_SOURCES", () => {
  it("lists exactly Kenney", () => {
    expect(AUTHORIZED_INDEXED_CATALOG_SOURCES.map((s) => s.id)).toEqual(["kenney"]);
  });

  it("has connectionMode authorized-indexed-catalog", () => {
    expect(AUTHORIZED_INDEXED_CATALOG_SOURCES[0].connectionMode).toBe("authorized-indexed-catalog");
  });
});

describe("integrated sources overall", () => {
  it("groups A and B together cover no more and no fewer than the 8 real live providers wired into search", () => {
    const allIds = [...LIVE_API_SOURCES, ...AUTHORIZED_INDEXED_CATALOG_SOURCES].map((s) => s.id).sort();
    expect(allIds).toEqual(
      ["ambientcg", "kenney", "nasa", "openverse", "pixabay", "polyhaven", "sketchfab", "wikimedia"].sort(),
    );
  });
});
