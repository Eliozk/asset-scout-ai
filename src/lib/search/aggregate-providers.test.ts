import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssetSearchProvider, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { searchAllProviders, searchProvidersProgressively, type AggregatedSearchResult } from "./aggregate-providers";

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
      return [...(behavior.assets ?? [])];
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

describe("searchProvidersProgressively", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function collect() {
    const snapshots: { snapshot: AggregatedSearchResult; isFinal: boolean }[] = [];
    return { snapshots, onSnapshot: (snapshot: AggregatedSearchResult, isFinal: boolean) => snapshots.push({ snapshot, isFinal }) };
  }

  it("emits a single final snapshot when every provider answers within the grace window", async () => {
    vi.useFakeTimers();
    const { snapshots, onSnapshot } = collect();
    searchProvidersProgressively(
      [makeProvider("fast", { assets: [makeAsset("f1")], delayMs: 100 }), makeProvider("ok", { assets: [makeAsset("o1")], delayMs: 900 })],
      DEFAULT_QUERY,
      onSnapshot,
      { graceMs: 3_000, timeoutMs: 8_000 },
    );

    await vi.advanceTimersByTimeAsync(1_000);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].isFinal).toBe(true);
    expect(snapshots[0].snapshot.results.map((r) => r.id).sort()).toEqual(["f1", "o1"]);
  });

  it("never lets a hanging provider hold the page: shows healthy results after the grace window", async () => {
    vi.useFakeTimers();
    const { snapshots, onSnapshot } = collect();
    searchProvidersProgressively(
      [makeProvider("fast", { assets: [makeAsset("f1")], delayMs: 500 }), makeProvider("hang", { assets: [makeAsset("h1")], delayMs: 60_000 })],
      DEFAULT_QUERY,
      onSnapshot,
      { graceMs: 3_000, timeoutMs: 8_000 },
    );

    await vi.advanceTimersByTimeAsync(3_600);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].isFinal).toBe(false);
    expect(snapshots[0].snapshot.results.map((r) => r.id)).toEqual(["f1"]);
    expect(snapshots[0].snapshot.providerOutcomes.find((o) => o.providerId === "hang")?.status).toBe("pending");

    await vi.advanceTimersByTimeAsync(5_000);
    const last = snapshots.at(-1)!;
    expect(last.isFinal).toBe(true);
    expect(last.snapshot.providerOutcomes.find((o) => o.providerId === "hang")?.status).toBe("rejected");
  });

  it("still merges a slow-but-healthy provider that lands after the partial snapshot", async () => {
    vi.useFakeTimers();
    const { snapshots, onSnapshot } = collect();
    searchProvidersProgressively(
      [makeProvider("fast", { assets: [makeAsset("f1")], delayMs: 200 }), makeProvider("slow", { assets: [makeAsset("s1")], delayMs: 5_000 })],
      DEFAULT_QUERY,
      onSnapshot,
      { graceMs: 3_000, timeoutMs: 8_000 },
    );

    await vi.advanceTimersByTimeAsync(6_000);

    expect(snapshots.map((s) => s.isFinal)).toEqual([false, true]);
    expect(snapshots[1].snapshot.results.map((r) => r.id).sort()).toEqual(["f1", "s1"]);
  });

  it("emits nothing after cancel", async () => {
    vi.useFakeTimers();
    const { snapshots, onSnapshot } = collect();
    const cancel = searchProvidersProgressively([makeProvider("fast", { assets: [makeAsset("f1")], delayMs: 100 })], DEFAULT_QUERY, onSnapshot);
    cancel();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(snapshots).toHaveLength(0);
  });

  it("emits a final empty snapshot for an empty provider list", async () => {
    const { snapshots, onSnapshot } = collect();
    searchProvidersProgressively([], DEFAULT_QUERY, onSnapshot);
    await Promise.resolve();
    expect(snapshots).toEqual([{ snapshot: { results: [], providerOutcomes: [] }, isFinal: true }]);
  });
});
