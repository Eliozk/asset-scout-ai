import { describe, expect, it } from "vitest";
import { EXTERNAL_MARKETPLACES } from "./registry";

const HOSTILE_QUERIES = [
  "javascript:alert(1)",
  "<script>alert(1)</script>",
  "&redirect=https://evil.example.com",
  "?admin=true",
  "../../etc/passwd",
  "%00%0d%0a",
  "data:text/html,<script>alert(1)</script>",
];

describe("EXTERNAL_MARKETPLACES registry", () => {
  it("has exactly the 14 marketplaces (10 from Milestone 4 Phase 4 + 4 added for the Gemini/provider-expansion milestone)", () => {
    expect(EXTERNAL_MARKETPLACES).toHaveLength(14);
  });

  it("has unique, non-empty ids", () => {
    const ids = EXTERNAL_MARKETPLACES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.trim()).not.toBe("");
  });

  it("has unique, non-empty display names", () => {
    const names = EXTERNAL_MARKETPLACES.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name.trim()).not.toBe("");
  });

  it("every id is entirely distinct from a real AssetSourceId (external links must never be confused with integrated sources)", async () => {
    const { ASSET_SOURCE_IDS } = await import("@/domain/asset");
    const ids = EXTERNAL_MARKETPLACES.map((m) => m.id);
    for (const id of ids) {
      expect((ASSET_SOURCE_IDS as readonly string[]).includes(id)).toBe(false);
    }
  });

  it("every homepage URL is HTTPS on the marketplace's own hard-coded host", () => {
    for (const marketplace of EXTERNAL_MARKETPLACES) {
      const url = new URL(marketplace.homepageUrl);
      expect(url.protocol).toBe("https:");
    }
  });

  it("every entry has a non-empty limitation and at least one specialty", () => {
    for (const marketplace of EXTERNAL_MARKETPLACES) {
      expect(marketplace.limitation.trim()).not.toBe("");
      expect(marketplace.specialties.length).toBeGreaterThan(0);
    }
  });

  it("supportsQuery is true only for outbound-search entries", () => {
    for (const marketplace of EXTERNAL_MARKETPLACES) {
      expect(marketplace.supportsQuery).toBe(marketplace.mode === "outbound-search");
    }
  });

  it("classifies exactly the 8 marketplaces with a verified query-preserving URL as outbound-search, and the other 6 as outbound-browse", () => {
    const searchNames = EXTERNAL_MARKETPLACES.filter((m) => m.mode === "outbound-search")
      .map((m) => m.name)
      .sort();
    const browseNames = EXTERNAL_MARKETPLACES.filter((m) => m.mode === "outbound-browse")
      .map((m) => m.name)
      .sort();

    expect(searchNames).toEqual(
      ["Unity Asset Store", "Fab", "itch.io", "OpenGameArt", "CraftPix", "CGTrader", "TextureCan", "ProductionCrate"].sort(),
    );
    expect(browseNames).toEqual(
      ["ArtStation Marketplace", "GameDev Market", "TurboSquid", "Mixamo", "CGBookcase", "Quaternius"].sort(),
    );
  });

  it("classifies CGTrader as an external outbound-search marketplace, never as a live API integration", async () => {
    const cgtrader = EXTERNAL_MARKETPLACES.find((m) => m.id === "cgtrader-external");
    expect(cgtrader?.mode).toBe("outbound-search");

    const { LIVE_API_SOURCES } = await import("@/lib/sources/integrated-sources");
    expect(LIVE_API_SOURCES.some((s) => s.name === "CGTrader")).toBe(false);
  });

  describe.each(EXTERNAL_MARKETPLACES.map((m) => [m.id, m] as const))("%s", (_id, marketplace) => {
    it("buildUrl always returns an HTTPS URL on this marketplace's own hard-coded host, regardless of query", () => {
      const expectedHost = new URL(marketplace.homepageUrl).hostname;
      const queries = ["dragon", "castle armor", "", "   ", ...HOSTILE_QUERIES, "מבצר קסום", "Cañón—naïve"];
      for (const query of queries) {
        const result = marketplace.buildUrl(query);
        const url = new URL(result); // throws if not a valid absolute URL — never javascript:/data:
        expect(url.protocol).toBe("https:");
        expect(url.hostname).toBe(expectedHost);
      }
    });

    it("falls back to the homepage for a blank or whitespace-only query", () => {
      expect(marketplace.buildUrl("")).toBe(marketplace.homepageUrl);
      expect(marketplace.buildUrl("   ")).toBe(marketplace.homepageUrl);
      expect(marketplace.buildUrl("\t\n")).toBe(marketplace.homepageUrl);
    });

    if (marketplace.supportsQuery && marketplace.searchUrlStyle !== "path") {
      function decodedParamValues(url: URL): readonly string[] {
        return [...url.searchParams.values()];
      }

      it("encodes an English query into the URL safely", () => {
        const url = new URL(marketplace.buildUrl("dragon castle"));
        expect(decodedParamValues(url)).toContain("dragon castle");
      });

      it("encodes a Hebrew query into the URL safely (correct round-trip, not mangled bytes)", () => {
        const hebrew = "מבצר קסום";
        const url = new URL(marketplace.buildUrl(hebrew));
        expect(decodedParamValues(url)).toContain(hebrew);
      });

      it("encodes punctuation without breaking the URL", () => {
        const punctuated = "sci-fi: robot's \"laser\" gun (v2) & shield";
        const url = new URL(marketplace.buildUrl(punctuated));
        expect(decodedParamValues(url)).toContain(punctuated);
      });

      it.each(HOSTILE_QUERIES)("keeps hostile-looking input %s as inert data, never an extra parameter or protocol change", (hostile) => {
        const result = marketplace.buildUrl(hostile);
        const url = new URL(result);
        expect(url.protocol).toBe("https:");
        expect(url.hostname).toBe(new URL(marketplace.homepageUrl).hostname);
        // The hostile string must appear only as an (encoded) parameter VALUE, never introduce a second
        // parameter of its own (e.g. "&redirect=..." must not become a real "redirect" param).
        expect(url.searchParams.has("redirect")).toBe(false);
        expect(url.searchParams.has("admin")).toBe(false);
      });
    } else if (marketplace.supportsQuery && marketplace.searchUrlStyle === "path") {
      // Path-based search (e.g. texturecan.com/search/{query}/1/) — the query
      // lives in the URL PATH, not a query-string parameter, so it's verified
      // by decoding the pathname segment instead of searchParams.
      it("round-trips an English/Hebrew/punctuated query through the path safely", () => {
        for (const query of ["dragon castle", "מבצר קסום", "sci-fi: robot's \"laser\" gun (v2) & shield"]) {
          const url = new URL(marketplace.buildUrl(query));
          expect(decodeURIComponent(url.pathname)).toContain(query);
        }
      });

      it("never lets a mixed hostile query (slashes, dots-plus-text) escape the intended search path", () => {
        for (const hostile of [...HOSTILE_QUERIES, "a/../../b"]) {
          const url = new URL(marketplace.buildUrl(hostile));
          expect(url.protocol).toBe("https:");
          expect(url.hostname).toBe(new URL(marketplace.homepageUrl).hostname);
          // "/search/" must still be present as a literal, un-collapsed prefix —
          // dot-segment normalization would have removed it if the query could
          // inject a literal "/" or a bare "."/".." segment.
          expect(url.pathname.startsWith("/search/")).toBe(true);
        }
      });

      it("falls back to the homepage for a pure-dots query (\".\", \"..\"), which has no safe path-segment representation", () => {
        // Verified empirically: this URL engine collapses a dot-segment even
        // through percent-encoding (see registry.ts's isOnlyDots doc comment),
        // so the only safe behavior is the same fallback as an empty query.
        expect(marketplace.buildUrl(".")).toBe(marketplace.homepageUrl);
        expect(marketplace.buildUrl("..")).toBe(marketplace.homepageUrl);
        expect(marketplace.buildUrl("...")).toBe(marketplace.homepageUrl);
      });
    } else {
      it("always returns the homepage regardless of query (outbound-browse never fabricates a search URL)", () => {
        for (const query of ["dragon", "", "מבצר", ...HOSTILE_QUERIES]) {
          expect(marketplace.buildUrl(query)).toBe(marketplace.homepageUrl);
        }
      });
    }
  });
});
