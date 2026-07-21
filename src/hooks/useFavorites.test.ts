import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useFavorites } from "./useFavorites";

afterEach(() => {
  window.localStorage.clear();
});

describe("useFavorites", () => {
  it("starts with no favorites when storage is empty", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favoriteIds).toEqual([]);
    expect(result.current.isFavorite("dragon")).toBe(false);
  });

  it("adds and removes a favorite, persisting to localStorage", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite("dragon");
    });
    expect(result.current.favoriteIds).toEqual(["dragon"]);
    expect(JSON.parse(window.localStorage.getItem("asset-scout-ai:favorites") ?? "[]")).toEqual(["dragon"]);

    act(() => {
      result.current.toggleFavorite("dragon");
    });
    expect(result.current.favoriteIds).toEqual([]);
  });

  it("reads previously persisted favorites on mount", () => {
    window.localStorage.setItem("asset-scout-ai:favorites", JSON.stringify(["sword"]));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favoriteIds).toEqual(["sword"]);
    expect(result.current.isFavorite("sword")).toBe(true);
  });
});
