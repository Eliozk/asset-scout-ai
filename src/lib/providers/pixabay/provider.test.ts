import { afterEach, describe, expect, it, vi } from "vitest";
import type { AssetSearchProvider } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { pixabaySearchProvider } from "./provider";
import { searchAllProviders } from "@/lib/search/aggregate-providers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pixabaySearchProvider", () => {
  it("returns [] for an empty query without calling our own route at all", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const results = await pixabaySearchProvider.search(DEFAULT_QUERY);

    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("surfaces our own route's error message (e.g. 'not configured') by throwing, so the aggregation layer can isolate it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Pixabay is not configured (missing PIXABAY_API_KEY) — see .env.example." }), {
          status: 502,
        }),
      ),
    );

    await expect(pixabaySearchProvider.search({ ...DEFAULT_QUERY, text: "cats" })).rejects.toThrow(
      /not configured/,
    );
  });

  it("a Pixabay failure never breaks a healthy provider queried alongside it (Promise.allSettled isolation)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "unavailable" }), { status: 502 })));

    const healthyProvider: AssetSearchProvider = {
      id: "healthy-provider",
      label: "Healthy",
      search: async () => [],
    };

    const outcome = await searchAllProviders([pixabaySearchProvider, healthyProvider], {
      ...DEFAULT_QUERY,
      text: "cats",
    });

    expect(outcome.providerOutcomes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ providerId: "pixabay-live", status: "rejected" }),
        { providerId: "healthy-provider", status: "fulfilled" },
      ]),
    );
  });
});
