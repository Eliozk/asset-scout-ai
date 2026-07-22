import { describe, expect, it } from "vitest";
import { tokenizeSearchText } from "./tokenize";

describe("tokenizeSearchText", () => {
  it("drops common English stopwords", () => {
    expect(tokenizeSearchText("a for an the with of in on to and or from by at is are")).toEqual([]);
  });

  it("keeps meaningful words", () => {
    expect(tokenizeSearchText("dragon urp mobile")).toEqual(["dragon", "urp", "mobile"]);
  });

  it("keeps short-but-meaningful game-asset terms", () => {
    expect(tokenizeSearchText("2d 3d ui vr hdri pbr")).toEqual(["2d", "3d", "ui", "vr", "hdri", "pbr"]);
  });

  it("keeps hyphenated compound terms as a single token", () => {
    expect(tokenizeSearchText("a low-poly dragon")).toEqual(["low-poly", "dragon"]);
  });

  it("strips surrounding punctuation but preserves internal hyphens", () => {
    expect(tokenizeSearchText("dragon, low-poly! (rigged)")).toEqual(["dragon", "low-poly", "rigged"]);
  });

  it("drops single-character noise tokens", () => {
    expect(tokenizeSearchText("a x dragon")).toEqual(["dragon"]);
  });

  it("returns an empty array for an all-stopword or empty query", () => {
    expect(tokenizeSearchText("")).toEqual([]);
    expect(tokenizeSearchText("   ")).toEqual([]);
    expect(tokenizeSearchText("the a an")).toEqual([]);
  });

  it("lowercases input", () => {
    expect(tokenizeSearchText("Dragon URP Mobile")).toEqual(["dragon", "urp", "mobile"]);
  });

  it("preserves Hebrew tokens instead of stripping them to nothing (regression: non-Latin scripts must not collapse to an empty term list)", () => {
    expect(tokenizeSearchText("חרב")).toEqual(["חרב"]);
    expect(tokenizeSearchText("כיסא עץ ישן")).toEqual(["כיסא", "עץ", "ישן"]);
  });

  it("preserves accented Latin characters", () => {
    expect(tokenizeSearchText("naïve café")).toEqual(["naïve", "café"]);
  });

  it("still strips real ASCII punctuation surrounding non-Latin words", () => {
    expect(tokenizeSearchText('"חרב" (מימי הביניים)!')).toEqual(["חרב", "מימי", "הביניים"]);
  });
});
