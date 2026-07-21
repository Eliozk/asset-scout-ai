import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";

const { mockGetSemanticRuntime } = vi.hoisted(() => ({ mockGetSemanticRuntime: vi.fn() }));

vi.mock("@/lib/semantic/browser-runtime", () => ({
  getSemanticRuntime: mockGetSemanticRuntime,
}));

import { useSemanticRanking } from "./useSemanticRanking";

function makeAsset(id: string): AssetSearchResult {
  return {
    id,
    name: id,
    description: "",
    source: "polyhaven",
    category: "3D",
    assetType: "Prop",
    pricing: { model: "free" },
    license: "CC0",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "",
    externalUrl: "https://polyhaven.com/a/test",
    addedAt: "2026-01-01",
  };
}

function makeProvider(candidatePool: readonly AssetSearchResult[]): AssetSearchProvider {
  return {
    id: "fake",
    label: "Fake",
    search: vi.fn().mockResolvedValue(candidatePool),
  };
}

describe("useSemanticRanking", () => {
  it("starts in 'loading' and falls back to the deterministic results immediately", () => {
    mockGetSemanticRuntime.mockReturnValue(new Promise(() => {})); // never resolves in this test
    const deterministicResults = [makeAsset("a"), makeAsset("b")];
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "dragon" };
    const provider = makeProvider(deterministicResults);

    const { result } = renderHook(() => useSemanticRanking(query, deterministicResults, [provider]));

    expect(result.current.status).toBe("loading");
    expect(result.current.ranked).toEqual(deterministicResults);
    expect(result.current.scoresById.size).toBe(0);
  });

  it("transitions to 'unavailable' when the runtime fails to load, and keeps the deterministic fallback", async () => {
    mockGetSemanticRuntime.mockReturnValue(Promise.reject(new Error("WebGPU/WASM unsupported")));
    const deterministicResults = [makeAsset("a")];
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "dragon" };
    const provider = makeProvider(deterministicResults);

    const { result } = renderHook(() => useSemanticRanking(query, deterministicResults, [provider]));

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.ranked).toEqual(deterministicResults);
    expect(result.current.scoresById.size).toBe(0);
  });

  it("transitions to 'ready' and re-ranks a broader (non-text-filtered) candidate pool by semantic similarity", async () => {
    // "b" wouldn't survive the strict AND keyword filter for a long natural-
    // language query, but it's still in the broader candidate pool the
    // provider returns when semantic ranking clears the text filter.
    const candidatePool = [makeAsset("a"), makeAsset("b")];
    const embeddingsById = new Map<string, Float32Array>([
      ["a", new Float32Array([0, 1, 0])], // far from the query
      ["b", new Float32Array([1, 0, 0])], // close to the query
    ]);
    mockGetSemanticRuntime.mockReturnValue(
      Promise.resolve({
        manifest: { modelId: "test-model", dimensions: 3, catalogVersion: "v1", generatedAt: "now", count: 2, assetIds: ["a", "b"] },
        embeddingsById,
        embedQuery: async () => new Float32Array([1, 0, 0]),
      }),
    );

    const deterministicResults: AssetSearchResult[] = []; // simulates the strict AND filter finding nothing
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "a worn old ball for a realistic sports game" };
    const provider = makeProvider(candidatePool);

    const { result } = renderHook(() => useSemanticRanking(query, deterministicResults, [provider]));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    await waitFor(() => expect(result.current.ranked.map((a) => a.id)).toEqual(["b", "a"]));
    expect(result.current.scoresById.get("b")).toBeGreaterThan(0);
    expect(provider.search).toHaveBeenCalledWith(expect.objectContaining({ text: "" }));
  });

  it("does not rank (stays on deterministic order) when there is no search text, even once ready", async () => {
    mockGetSemanticRuntime.mockReturnValue(
      Promise.resolve({
        manifest: { modelId: "test-model", dimensions: 3, catalogVersion: "v1", generatedAt: "now", count: 1, assetIds: ["a"] },
        embeddingsById: new Map([["a", new Float32Array([1, 0, 0])]]),
        embedQuery: async () => new Float32Array([1, 0, 0]),
      }),
    );

    const deterministicResults = [makeAsset("a")];
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "" };
    const provider = makeProvider(deterministicResults);

    const { result } = renderHook(() => useSemanticRanking(query, deterministicResults, [provider]));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.ranked).toEqual(deterministicResults);
    expect(result.current.scoresById.size).toBe(0);
  });

  it("does not rank when the user picked an explicit sort (e.g. price), even once ready", async () => {
    mockGetSemanticRuntime.mockReturnValue(
      Promise.resolve({
        manifest: { modelId: "test-model", dimensions: 3, catalogVersion: "v1", generatedAt: "now", count: 1, assetIds: ["a"] },
        embeddingsById: new Map([["a", new Float32Array([1, 0, 0])]]),
        embedQuery: async () => new Float32Array([1, 0, 0]),
      }),
    );

    const deterministicResults = [makeAsset("a")];
    const query: AssetSearchQuery = { ...DEFAULT_QUERY, text: "dragon", sort: "price-asc" };
    const provider = makeProvider(deterministicResults);

    const { result } = renderHook(() => useSemanticRanking(query, deterministicResults, [provider]));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.ranked).toEqual(deterministicResults);
    expect(result.current.scoresById.size).toBe(0);
  });
});
