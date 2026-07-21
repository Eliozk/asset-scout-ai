import { describe, expect, it } from "vitest";
import type { AssetSearchProvider, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { searchAllProviders } from "./aggregate-providers";

function makeAsset(id: string, source: AssetSearchResult["source"] = "polyhaven"): AssetSearchResult {
  return {
    id,
    name: id,
    description: "",
    source,
    category: "3D",
    assetType: "Prop",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://example.com",
    addedAt: "2026-01-01",
  };
}

function makeProvider(
  id: string,
  behavior: { assets?: readonly AssetSearchResult[]; error?: string; delayMs?: number },
): AssetSearchProvider {
  return {
    id,
    label: id,
    async search() {
      if (behavior.delayMs) await new Promise((r) => setTimeout(r, behavior.delayMs));
      if (behavior.error) throw new Error(behavior.error);
      return behavior.assets ?? [];
    },
  };
}

describe("searchAllProviders", () => {
  it("combines results from every provider that succeeds", async () => {
    const providerA = makeProvider("a", { assets: [makeAsset("a1")] });
    const providerB = makeProvider("b", { assets: [makeAsset("b1"), makeAsset("b2")] });

    const result = await searchAllProviders([providerA, providerB], DEFAULT_QUERY);

    expect(result.results.map((r) => r.id).sort()).toEqual(["a1", "b1", "b2"].sort());
    expect(result.providerOutcomes).toEqual([
      { providerId: "a", status: "fulfilled" },
      { providerId: "b", status: "fulfilled" },
    ]);
  });

  it("isolates a failing provider — the other provider's results still come back", async () => {
    const goodProvider = makeProvider("good", { assets: [makeAsset("g1")] });
    const badProvider = makeProvider("bad", { error: "Sketchfab is unavailable right now." });

    const result = await searchAllProviders([goodProvider, badProvider], DEFAULT_QUERY);

    expect(result.results.map((r) => r.id)).toEqual(["g1"]);
    expect(result.providerOutcomes).toEqual([
      { providerId: "good", status: "fulfilled" },
      { providerId: "bad", status: "rejected", error: "Sketchfab is unavailable right now." },
    ]);
  });

  it("times out a slow provider without waiting for it or failing the others", async () => {
    const fastProvider = makeProvider("fast", { assets: [makeAsset("f1")] });
    const slowProvider = makeProvider("slow", { assets: [makeAsset("s1")], delayMs: 500 });

    const result = await searchAllProviders([fastProvider, slowProvider], DEFAULT_QUERY, 50);

    expect(result.results.map((r) => r.id)).toEqual(["f1"]);
    const slowOutcome = result.providerOutcomes.find((o) => o.providerId === "slow");
    expect(slowOutcome?.status).toBe("rejected");
    expect(slowOutcome?.error).toMatch(/timed out/i);
  });

  it("returns an empty result set (not a throw) when every provider fails", async () => {
    const providerA = makeProvider("a", { error: "down" });
    const providerB = makeProvider("b", { error: "also down" });

    const result = await searchAllProviders([providerA, providerB], DEFAULT_QUERY);

    expect(result.results).toEqual([]);
    expect(result.providerOutcomes.every((o) => o.status === "rejected")).toBe(true);
  });
});
