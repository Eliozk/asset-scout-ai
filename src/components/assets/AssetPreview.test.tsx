import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AssetSearchResult } from "@/domain/asset";
import { AssetPreview } from "./AssetPreview";

afterEach(cleanup);

function makeAsset(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    id: "test-asset",
    name: "Test Asset",
    description: "A test asset description.",
    source: "sketchfab",
    category: "3D",
    assetType: "Character",
    pricing: { model: "free" },
    license: "CC0",
    formats: ["FBX"],
    engines: ["Unity"],
    style: "Low-poly",
    tags: ["test"],
    matchScore: 50,
    whyItFits: "Because it is a test.",
    externalUrl: "https://example.com",
    addedAt: "2026-01-01",
    ...overrides,
  };
}

describe("AssetPreview", () => {
  it("shows the CSS/gradient icon placeholder when no thumbnailUrl is present", () => {
    const { container } = render(<AssetPreview asset={makeAsset({ thumbnailUrl: undefined })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders a real thumbnail image with object-contain (never object-cover, so the full object stays visible)", () => {
    const { container } = render(
      <AssetPreview asset={makeAsset({ thumbnailUrl: "https://cdn.polyhaven.com/thumb.png" })} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.className).toContain("object-contain");
    expect(img?.className).not.toContain("object-cover");
  });

  it("sizes the image intrinsically (h-auto/w-auto capped by max-h-full/max-w-full) instead of stretching to fill the card", () => {
    const { container } = render(
      <AssetPreview asset={makeAsset({ thumbnailUrl: "https://cdn.polyhaven.com/thumb.png" })} />,
    );
    const img = container.querySelector("img");
    expect(img?.className).toContain("h-auto");
    expect(img?.className).toContain("w-auto");
    expect(img?.className).toContain("max-h-full");
    expect(img?.className).toContain("max-w-full");
  });

  it("falls back to the icon placeholder when the image fails to load", () => {
    const { container } = render(
      <AssetPreview asset={makeAsset({ thumbnailUrl: "https://cdn.polyhaven.com/broken.png" })} />,
    );
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("always shows the 2D/3D category badge, with or without a thumbnail", () => {
    const withImage = render(
      <AssetPreview asset={makeAsset({ thumbnailUrl: "https://cdn.polyhaven.com/thumb.png", category: "3D" })} />,
    );
    expect(withImage.container.textContent).toContain("3D");
    cleanup();

    const withoutImage = render(<AssetPreview asset={makeAsset({ thumbnailUrl: undefined, category: "both" })} />);
    expect(withoutImage.container.textContent).toContain("2D / 3D");
  });
});
