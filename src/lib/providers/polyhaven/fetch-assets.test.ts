import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPolyHavenCatalog,
  parseAndNormalizeCatalog,
  PolyHavenUpstreamError,
  resetPolyHavenCatalogCacheForTests,
} from "./fetch-assets";
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

describe("fetchPolyHavenCatalog caching", () => {
  beforeEach(() => {
    resetPolyHavenCatalogCacheForTests();
    // Only fake Date — the cache's TTL check reads Date.now(), but leaving
    // setTimeout/AbortSignal.timeout's real scheduling alone avoids any
    // interaction with the real network-timeout logic in fetchFreshCatalog.
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    resetPolyHavenCatalogCacheForTests();
  });

  it("never passes Next's fetch Data Cache options — the ~3MB catalog response is over its 2MB per-entry limit", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchPolyHavenCatalog();

    const [, init] = fetchSpy.mock.calls[0];
    expect(init).not.toHaveProperty("next");
  });

  it("serves a repeat call from the in-memory cache without hitting the network again", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);

    const first = await fetchPolyHavenCatalog();
    const second = await fetchPolyHavenCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("re-fetches once the ~6h cache window has elapsed", async () => {
    // A fresh Response per call — a Response body can only be read once, and
    // this test calls fetchPolyHavenCatalog() (and so .json()) twice.
    const fetchSpy = vi.fn().mockImplementation(() => jsonResponse({ good_hdri: HDRI_FIXTURE }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchPolyHavenCatalog();
    vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);
    await fetchPolyHavenCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shares a single in-flight request across concurrent callers during a cache miss", async () => {
    let resolveFetch: (value: Response) => void;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchSpy = vi.fn().mockReturnValue(pendingFetch);
    vi.stubGlobal("fetch", fetchSpy);

    const callA = fetchPolyHavenCatalog();
    const callB = fetchPolyHavenCatalog();
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

    await expect(fetchPolyHavenCatalog()).rejects.toThrow(PolyHavenUpstreamError);
    const result = await fetchPolyHavenCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.assets).toHaveLength(1);
  });
});
