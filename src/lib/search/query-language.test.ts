import { describe, expect, it } from "vitest";
import { containsUnsupportedScript } from "./query-language";

describe("containsUnsupportedScript", () => {
  it("detects Hebrew", () => {
    expect(containsUnsupportedScript("חרב מימי הביניים")).toBe(true);
  });

  it("detects Arabic, Cyrillic, and CJK", () => {
    expect(containsUnsupportedScript("سيف")).toBe(true);
    expect(containsUnsupportedScript("меч")).toBe(true);
    expect(containsUnsupportedScript("剣")).toBe(true);
  });

  it("returns false for English text", () => {
    expect(containsUnsupportedScript("medieval sword")).toBe(false);
    expect(containsUnsupportedScript("2D low-poly dragon!")).toBe(false);
  });

  it("returns false for accented Latin text", () => {
    expect(containsUnsupportedScript("naïve café")).toBe(false);
  });

  it("returns false for an empty or blank query", () => {
    expect(containsUnsupportedScript("")).toBe(false);
    expect(containsUnsupportedScript("   ")).toBe(false);
  });

  it("detects a mixed English + Hebrew query", () => {
    expect(containsUnsupportedScript("sword חרב")).toBe(true);
  });
});
