import type { AssetSearchResult } from "@/domain/asset";
import { isPixabaySearchResponse, parsePixabayRawHit } from "./raw-types";
import { normalizePixabayHit } from "./normalize";

const PIXABAY_API_BASE = "https://pixabay.com/api";
const UPSTREAM_TIMEOUT_MS = 8_000;
/**
 * Pixabay's API docs mandate: "requests must be cached for 24 hours."
 * (https://pixabay.com/api/docs/, fetched live 2026-07). This is the
 * compliance point — every distinct upstream query is cached this long via
 * Next's fetch Data Cache before we'd ever hit pixabay.com again for it.
 */
const REVALIDATE_SECONDS = 60 * 60 * 24;

export interface PixabaySearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class PixabayUpstreamError extends Error {}
export class PixabayNotConfiguredError extends PixabayUpstreamError {}

/**
 * Pure: validates and normalizes a raw `/api/` response body. Split out from
 * fetchPixabayImages so "malformed entries get skipped, not thrown" is
 * unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): PixabaySearchResult {
  if (!isPixabaySearchResponse(json)) {
    throw new PixabayUpstreamError("Pixabay returned an unexpected response shape.");
  }

  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of json.hits) {
    try {
      const raw = parsePixabayRawHit(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizePixabayHit(raw));
    } catch {
      skipped += 1;
    }
  }

  return { assets, totalUpstream: json.hits.length, skipped };
}

function requireApiKey(): string {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    throw new PixabayNotConfiguredError(
      "Pixabay is not configured (missing PIXABAY_API_KEY) — see .env.example.",
    );
  }
  return key;
}

async function requestPixabay(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new PixabayUpstreamError(`Pixabay request ${reason}.`);
  }

  if (response.status === 429) {
    throw new PixabayUpstreamError("Pixabay rate limit exceeded — try again shortly.");
  }
  if (!response.ok) {
    throw new PixabayUpstreamError(`Pixabay responded with status ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new PixabayUpstreamError("Pixabay returned a response we couldn't parse.");
  }
}

/**
 * Server-only: searches Pixabay's public image API (photos, illustrations,
 * and vectors — the only image content the documented API exposes; 3D
 * Models, Music, Sound Effects, and GIFs are website-only categories with no
 * public API endpoint, so they are never requested here). Requires
 * PIXABAY_API_KEY — every Pixabay request needs a key, unlike Sketchfab's
 * optional token.
 *
 * This module must only be imported from a Route Handler — client code
 * talks to our own /api/providers/pixabay route instead, never to Pixabay
 * directly, so the key never reaches the browser.
 */
export async function fetchPixabayImages(query: string, perPage = 24): Promise<PixabaySearchResult> {
  const key = requireApiKey();
  const url = new URL(`${PIXABAY_API_BASE}/`);
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", String(Math.min(Math.max(perPage, 3), 200)));

  const json = await requestPixabay(url);
  return parseAndNormalizeSearch(json);
}

/**
 * Server-only: looks up one Pixabay image by id (documented `id` parameter
 * on the same `/api/` endpoint) — used to resolve a favorited Pixabay image
 * without ever storing/rehosting it (see lib/providers/pixabay/provider.ts
 * for why this matters for the anti-permanent-hotlinking rule). Returns null
 * for a not-found or empty result rather than throwing.
 */
export async function fetchPixabayImageById(id: string): Promise<AssetSearchResult | null> {
  const key = requireApiKey();
  const url = new URL(`${PIXABAY_API_BASE}/`);
  url.searchParams.set("key", key);
  url.searchParams.set("id", id);

  const json = await requestPixabay(url);
  const { assets } = parseAndNormalizeSearch(json);
  return assets[0] ?? null;
}
