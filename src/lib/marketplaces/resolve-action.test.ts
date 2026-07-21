import { describe, expect, it } from "vitest";
import type { ExternalMarketplace } from "./registry";
import { resolveMarketplaceAction } from "./resolve-action";

function makeSearchMarketplace(): ExternalMarketplace {
  return {
    id: "test-search-external",
    name: "Test Marketplace",
    specialties: ["test assets"],
    mode: "outbound-search",
    homepageUrl: "https://test-marketplace.example/",
    limitation: "Test limitation.",
    supportsQuery: true,
    buildUrl: (query) => {
      const trimmed = query.trim();
      if (trimmed === "") return "https://test-marketplace.example/";
      const url = new URL("https://test-marketplace.example/search");
      url.searchParams.set("q", trimmed);
      return url.toString();
    },
  };
}

function makeBrowseMarketplace(): ExternalMarketplace {
  return {
    id: "test-browse-external",
    name: "Test Browse Marketplace",
    specialties: ["test assets"],
    mode: "outbound-browse",
    homepageUrl: "https://test-browse.example/",
    limitation: "Test limitation.",
    supportsQuery: false,
    buildUrl: () => "https://test-browse.example/",
  };
}

describe("resolveMarketplaceAction", () => {
  it("labels and links to a real search for a non-blank query on a search-capable marketplace", () => {
    const action = resolveMarketplaceAction(makeSearchMarketplace(), "dragon");
    expect(action.label).toBe("Search on Test Marketplace");
    expect(action.isSearch).toBe(true);
    expect(action.href).toBe("https://test-marketplace.example/search?q=dragon");
  });

  it("falls back to Browse (and the homepage) for a blank query, even on a search-capable marketplace", () => {
    const action = resolveMarketplaceAction(makeSearchMarketplace(), "");
    expect(action.label).toBe("Browse Test Marketplace");
    expect(action.isSearch).toBe(false);
    expect(action.href).toBe("https://test-marketplace.example/");
  });

  it("falls back to Browse for a whitespace-only query", () => {
    const action = resolveMarketplaceAction(makeSearchMarketplace(), "   \t  ");
    expect(action.label).toBe("Browse Test Marketplace");
    expect(action.isSearch).toBe(false);
  });

  it("always labels/links Browse for an outbound-browse marketplace, even with a real query", () => {
    const action = resolveMarketplaceAction(makeBrowseMarketplace(), "dragon");
    expect(action.label).toBe("Browse Test Browse Marketplace");
    expect(action.isSearch).toBe(false);
    expect(action.href).toBe("https://test-browse.example/");
  });

  it("trims the query before deciding and before building the URL", () => {
    const action = resolveMarketplaceAction(makeSearchMarketplace(), "  dragon  ");
    expect(action.href).toBe("https://test-marketplace.example/search?q=dragon");
  });
});
