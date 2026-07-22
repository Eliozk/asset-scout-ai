import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPolyHavenCatalogLoader, parseAndNormalizeCatalog, PolyHavenUpstreamError } from "./fetch-assets";
import {
  HDRI_FIXTURE,
  MALFORMED_MISSING_THUMBNAIL,
  MALFORMED_NSFW,
  MALFORMED_UNKNOWN_TYPE,
  MODEL_FIXTURE,
  TEXTURE_FIXTURE,
} from "./__fixtures__/sample-assets";

describe("parseAndNormalizeCatalog", () => {
  it("normalizes every well-formed entry in the response", () => {
    const result = parseAndNormalizeCatalog({
      aarfontein_dirt_road: HDRI_FIXTURE,
      aerial_asphalt_01: TEXTURE_FIXTURE,
      ArmChair_01: MODEL_FIXTURE,
    });

    expect(result.totalUpstream).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(3);
    expect(result.assets.map((a) => a.id).sort()).toEqual(
      ["polyhaven:ArmChair_01", "polyhaven:aarfontein_dirt_road", "polyhaven:aerial_asphalt_01"].sort(),
    );
  });

  it("skips malformed entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeCatalog({
      good_hdri: HDRI_FIXTURE,
      broken_1: MALFORMED_MISSING_THUMBNAIL,
      broken_2: MALFORMED_UNKNOWN_TYPE,
      broken_3: MALFORMED_NSFW,
    });

    expect(result.totalUpstream).toBe(4);
    expect(result.skipped).toBe(3);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("polyhaven:good_hdri");
  });

  it("throws a controlled PolyHavenUpstreamError for a non-dict response", () => {
    expect(() => parseAndNormalizeCatalog(["not", "a", "dict"])).toThrow(PolyHavenUpstreamError);
    expect(() => parseAndNormalizeCatalog(null)).toThrow(PolyHavenUpstreamError);
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("createPolyHavenCatalogLoader: static-catalog-preferred", () => {
  it("returns the given static catalog directly and never touches the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const staticAsset = parseAndNormalizeCatalog({ good_hdri: HDRI_FIXTURE }).assets;
    const { fetchCatalog } = createPolyHavenCatalogLoader(staticAsset, {
      sourceUrl: "https://api.polyhaven.com/assets",
      generatedAt: "2026-01-01T00:00:00.000Z",
      catalogVersion: "abc123",
      count: staticAsset.length,
      totalUpstream: 5,
      skipped: 1,
      license: "CC0",
    });

    const result = await fetchCatalog();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.assets).toEqual(staticAsset);
    expect(result.totalUpstream).toBe(5);
    expect(result.skipped).toBe(1);

    vi.unstubAllGlobals();
  });
});

describe("createPolyHavenCatalogLoader: live-fetch fallback (empty static catalog)", () => {
  beforeEach(() => {
    // Only fake Date — the cache's TTL check reads Date.now(), but leaving
    // setTimeout/AbortSignal.timeout's real scheduling alone avoids any
    // interaction with the real network-timeout logic in fetchFreshCatalog.
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("never passes Next's fetch Data Cache options — the ~3MB catalog response is over its 2MB per-entry limit", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCatalog } = createPolyHavenCatalogLoader([], null);

    await fetchCatalog();

    const [, init] = fetchSpy.mock.calls[0];
    expect(init).not.toHaveProperty("next");
  });

  it("serves a repeat call from the in-memory cache without hitting the network again", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCatalog } = createPolyHavenCatalogLoader([], null);

    const first = await fetchCatalog();
    const second = await fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("re-fetches once the ~6h cache window has elapsed", async () => {
    // A fresh Response per call — a Response body can only be read once, and
    // this test calls fetchCatalog() (and so .json()) twice.
    const fetchSpy = vi.fn().mockImplementation(() => jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCatalog } = createPolyHavenCatalogLoader([], null);

    await fetchCatalog();
    vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);
    await fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shares a single in-flight request across concurrent callers during a cache miss", async () => {
    let resolveFetch: (value: Response) => void;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchSpy = vi.fn().mockReturnValue(pendingFetch);
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCatalog } = createPolyHavenCatalogLoader([], null);

    const callA = fetchCatalog();
    const callB = fetchCatalog();
    resolveFetch!(jsonResponse({ good_hdri: HDRI_FIXTURE }));

    const [resultA, resultB] = await Promise.all([callA, callB]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(resultA).toEqual(resultB);
  });

  it("does not cache a failed fetch — a later call retries the network", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);
    const { fetchCatalog } = createPolyHavenCatalogLoader([], null);

    await expect(fetchCatalog()).rejects.toThrow(PolyHavenUpstreamError);
    const result = await fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.assets).toHaveLength(1);
  });
});
