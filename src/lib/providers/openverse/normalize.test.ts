import { describe, expect, it } from "vitest";
import { parseOpenverseRawResult } from "./raw-types";
import { normalizeOpenverseResult } from "./normalize";
import { CC0_RESULT, CC_BY_SA_RESULT } from "./__fixtures__/sample-results";

describe("normalizeOpenverseResult", () => {
  it("maps a CC BY-SA license to Custom with the real attribution preserved, never a falsely-permissive bucket", () => {
    const raw = parseOpenverseRawResult(CC_BY_SA_RESULT);
    const asset = normalizeOpenverseResult(raw!);

    expect(asset.id).toBe("openverse:4c9447af-dc33-4d64-b4ad-127c5b62597c");
    expect(asset.license).toBe("Custom");
    expect(asset.licenseDetail).toContain("CC BY-SA");
    expect(asset.externalUrl).toBe(CC_BY_SA_RESULT.foreign_landing_url);
    expect(asset.thumbnailUrl).toBe(CC_BY_SA_RESULT.thumbnail);
    expect(asset.authors).toEqual(["ralphhogaboom"]);
  });

  it("maps cc0 to the CC0 enum", () => {
    const raw = parseOpenverseRawResult(CC0_RESULT);
    const asset = normalizeOpenverseResult(raw!);
    expect(asset.license).toBe("CC0");
  });
});
