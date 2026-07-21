import { describe, expect, it } from "vitest";
import { computeCatalogVersion } from "./catalog-version";

describe("computeCatalogVersion", () => {
  it("is deterministic for the same input", () => {
    const ids = ["polyhaven:a", "polyhaven:b", "polyhaven:c"];
    expect(computeCatalogVersion(ids)).toBe(computeCatalogVersion(ids));
  });

  it("is order-independent", () => {
    const a = ["polyhaven:a", "polyhaven:b", "polyhaven:c"];
    const b = ["polyhaven:c", "polyhaven:a", "polyhaven:b"];
    expect(computeCatalogVersion(a)).toBe(computeCatalogVersion(b));
  });

  it("changes when the id set changes", () => {
    const a = ["polyhaven:a", "polyhaven:b"];
    const b = ["polyhaven:a", "polyhaven:b", "polyhaven:c"];
    expect(computeCatalogVersion(a)).not.toBe(computeCatalogVersion(b));
  });

  it("changes when an id is swapped even if count stays the same", () => {
    const a = ["polyhaven:a", "polyhaven:b"];
    const b = ["polyhaven:a", "polyhaven:z"];
    expect(computeCatalogVersion(a)).not.toBe(computeCatalogVersion(b));
  });

  it("returns a non-empty hex-like string", () => {
    expect(computeCatalogVersion(["polyhaven:a"])).toMatch(/^[0-9a-f]{8}$/);
  });
});
