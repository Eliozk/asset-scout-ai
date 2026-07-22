import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FavoritesFab } from "./FavoritesFab";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  mockUsePathname.mockReturnValue("/");
});

describe("FavoritesFab", () => {
  it("renders a link to /favorites when not already on that page", () => {
    const { container } = render(<FavoritesFab />);
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("/favorites");
  });

  it("renders nothing on the Favorites page itself", () => {
    mockUsePathname.mockReturnValue("/favorites");
    const { container } = render(<FavoritesFab />);
    expect(container.querySelector("a")).toBeNull();
  });

  it("shows no count badge when there are no favorites", () => {
    const { container } = render(<FavoritesFab />);
    expect(container.textContent).not.toMatch(/\d/);
  });

  it("shows the correct count once favorites are saved", () => {
    window.localStorage.setItem("asset-scout-ai:favorites", JSON.stringify(["a", "b", "c"]));
    const { container } = render(<FavoritesFab />);
    expect(container.textContent).toContain("3");
  });

  it("caps the displayed count at 99+", () => {
    const ids = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    window.localStorage.setItem("asset-scout-ai:favorites", JSON.stringify(ids));
    const { container } = render(<FavoritesFab />);
    expect(container.textContent).toContain("99+");
  });

  it("has an accessible label mentioning the saved count", () => {
    window.localStorage.setItem("asset-scout-ai:favorites", JSON.stringify(["a"]));
    const { container } = render(<FavoritesFab />);
    const link = container.querySelector("a");
    expect(link?.getAttribute("aria-label")).toMatch(/favorites.*1/i);
  });
});
