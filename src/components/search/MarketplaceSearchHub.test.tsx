import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarketplaceSearchHub } from "./MarketplaceSearchHub";
import { EXTERNAL_MARKETPLACES } from "@/lib/marketplaces/registry";

afterEach(cleanup);

describe("MarketplaceSearchHub", () => {
  it("renders exactly one card per registered marketplace", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(EXTERNAL_MARKETPLACES.length);
  });

  it("every link opens in a new tab with rel=noopener noreferrer", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const links = container.querySelectorAll("a");
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("every link points to an HTTPS URL, never javascript:/data:", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const links = container.querySelectorAll("a");
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
    }
  });

  it("every card shows an 'External marketplace' badge", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const badgeCount = Array.from(container.querySelectorAll("a")).filter((link) =>
      link.textContent?.includes("External marketplace"),
    ).length;
    expect(badgeCount).toBe(EXTERNAL_MARKETPLACES.length);
  });

  it("labels search-capable marketplaces 'Search on {name}' when a real query is active", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const unityLink = Array.from(container.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Unity Asset Store"),
    );
    expect(unityLink?.textContent).toContain("Search on Unity Asset Store");
    expect(unityLink?.getAttribute("href")).toBe("https://assetstore.unity.com/search?q=dragon");
  });

  it("falls back to 'Browse {name}' for every card when the query is blank", () => {
    const { container } = render(<MarketplaceSearchHub query="" />);
    const links = Array.from(container.querySelectorAll("a"));
    for (const link of links) {
      const marketplace = EXTERNAL_MARKETPLACES.find((m) => link.textContent?.includes(m.name));
      expect(link.textContent).toContain(`Browse ${marketplace?.name}`);
    }
  });

  it("always labels an outbound-browse marketplace 'Browse', even with a real query", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const mixamoLink = Array.from(container.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Mixamo"),
    );
    expect(mixamoLink?.textContent).toContain("Browse Mixamo");
    expect(mixamoLink?.getAttribute("href")).toBe("https://www.mixamo.com/");
  });

  it("never shows a match score, AI Match, price, license pill, or favorite control", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/AI Match/i);
    expect(text).not.toMatch(/keyword relevance/i);
    expect(text).not.toMatch(/CC0|CC-BY|Royalty-Free/);
    expect(container.querySelector("button[aria-label*='favorite' i]")).toBeNull();
  });

  it("gives every card an accessible name via aria-label mentioning the action", () => {
    const { container } = render(<MarketplaceSearchHub query="dragon" />);
    const links = container.querySelectorAll("a");
    for (const link of links) {
      const ariaLabel = link.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/(Search on|Browse) .+ \(opens in a new tab\)/);
    }
  });
});
