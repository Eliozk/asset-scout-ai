import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPixabayImageById,
  fetchPixabayImages,
  parseAndNormalizeSearch,
  PixabayNotConfiguredError,
  PixabayUpstreamError,
} from "./fetch-assets";
import { MALFORMED_UNTRUSTED_IMAGE_HOST, PHOTO_HIT, searchResponse } from "./__fixtures__/sample-hits";

describe("parseAndNormalizeSearch", () => {
  it("normalizes every well-formed hit in the response", () => {
    const result = parseAndNormalizeSearch(searchResponse(PHOTO_HIT));
    expect(result.totalUpstream).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe("pixabay:195893");
  });

  it("skips malformed entries instead of throwing, and still returns the valid ones", () => {
    const result = parseAndNormalizeSearch(searchResponse(PHOTO_HIT, MALFORMED_UNTRUSTED_IMAGE_HOST));
    expect(result.totalUpstream).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.assets).toHaveLength(1);
  });

  it("throws a controlled PixabayUpstreamError for a response with no hits array", () => {
    expect(() => parseAndNormalizeSearch({ notHits: [] })).toThrow(PixabayUpstreamError);
    expect(() => parseAndNormalizeSearch(null)).toThrow(PixabayUpstreamError);
    expect(() => parseAndNormalizeSearch("not an object")).toThrow(PixabayUpstreamError);
  });
});

describe("missing credentials", () => {
  const originalKey = process.env.PIXABAY_API_KEY;

  beforeEach(() => {
    delete process.env.PIXABAY_API_KEY;
  });

  afterEach(() => {
    if (originalKey !== undefined) process.env.PIXABAY_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("fetchPixabayImages throws PixabayNotConfiguredError without making a network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchPixabayImages("cats")).rejects.toThrow(PixabayNotConfiguredError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetchPixabayImageById throws PixabayNotConfiguredError without making a network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchPixabayImageById("195893")).rejects.toThrow(PixabayNotConfiguredError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("rate limit and caching", () => {
  const originalKey = process.env.PIXABAY_API_KEY;

  beforeEach(() => {
    process.env.PIXABAY_API_KEY = "test-key-not-real";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.PIXABAY_API_KEY;
    else process.env.PIXABAY_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("throws a controlled PixabayUpstreamError on HTTP 429 (rate limit exceeded)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("API rate limit exceeded", { status: 429 })),
    );

    await expect(fetchPixabayImages("cats")).rejects.toThrow(PixabayUpstreamError);
  });

  it("requests with Next's fetch Data Cache set to Pixabay's mandatory 24h revalidate window", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(searchResponse(PHOTO_HIT)), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchPixabayImages("cats");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.next).toEqual({ revalidate: 60 * 60 * 24 });
  });

  it("never sends the API key in a way that would leak it beyond the query string it's documented to require", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(searchResponse(PHOTO_HIT)), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchPixabayImages("cats");

    const [url] = fetchSpy.mock.calls[0];
    expect(url.toString()).toContain("key=test-key-not-real");
    expect(url.hostname).toBe("pixabay.com");
  });
});
