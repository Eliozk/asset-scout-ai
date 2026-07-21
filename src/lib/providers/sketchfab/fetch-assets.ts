import type { AssetSearchResult } from "@/domain/asset";
import { isSketchfabSearchResponse, parseSketchfabRawModel } from "./raw-types";
import { normalizeSketchfabModel } from "./normalize";

const SKETCHFAB_API_BASE = "https://api.sketchfab.com/v3";
const SKETCHFAB_SEARCH_URL = `${SKETCHFAB_API_BASE}/search`;
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;
const REVALIDATE_SECONDS = 60 * 60; // 1h — Sketchfab's rate limit is undocumented, so cache conservatively

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  const token = process.env.SKETCHFAB_API_TOKEN;
  if (token) headers.Authorization = `Token ${token}`;
  return headers;
}

export interface SketchfabSearchResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class SketchfabUpstreamError extends Error {}

/**
 * Pure: validates and normalizes a raw `/v3/search` response body. Split out
 * from fetchSketchfabModels so "malformed entries get skipped, not thrown"
 * is unit-testable without touching the network.
 */
export function parseAndNormalizeSearch(json: unknown): SketchfabSearchResult {
  if (!isSketchfabSearchResponse(json)) {
    throw new SketchfabUpstreamError("Sketchfab returned an unexpected response shape.");
  }

  const entries = json.results as readonly unknown[];
  const assets: AssetSearchResult[] = [];
  let skipped = 0;

  for (const entry of entries) {
    try {
      const raw = parseSketchfabRawModel(entry);
      if (!raw) {
        skipped += 1;
        continue;
      }
      assets.push(normalizeSketchfabModel(raw));
    } catch {
      // Never let one malformed/unexpected entry take down the whole result set.
      skipped += 1;
    }
  }

  return { assets, totalUpstream: entries.length, skipped };
}

/**
 * Server-only: searches Sketchfab's public model catalog for one query
 * (cached via Next's fetch Data Cache for ~1h per distinct query) and
 * delegates to parseAndNormalizeSearch.
 *
 * Sketchfab's model search (GET /v3/search?type=models) is publicly
 * accessible with no token, confirmed by calling the live endpoint directly.
 * An optional SKETCHFAB_API_TOKEN environment variable is sent as an
 * Authorization header when present (for any future higher-rate-limit
 * access), but is never required for this to function.
 *
 * This module must only be imported from the Route Handler — client code
 * talks to our own /api/providers/sketchfab route instead, never to
 * Sketchfab directly.
 */
export async function fetchSketchfabModels(query: string, count = 24): Promise<SketchfabSearchResult> {
  const url = new URL(SKETCHFAB_SEARCH_URL);
  url.searchParams.set("type", "models");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const headers = buildHeaders();

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new SketchfabUpstreamError(`Sketchfab request ${reason}.`);
  }

  if (!response.ok) {
    throw new SketchfabUpstreamError(`Sketchfab responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new SketchfabUpstreamError("Sketchfab returned a response we couldn't parse.");
  }

  return parseAndNormalizeSearch(json);
}

/**
 * Pure: validates and normalizes a raw `/v3/models/{uid}` response body
 * (a single raw model object, not a search-results wrapper). Returns null
 * for anything malformed rather than throwing — mirrors the
 * "skip malformed, never throw" rule used everywhere else in this provider.
 */
export function parseAndNormalizeModel(json: unknown): AssetSearchResult | null {
  const raw = parseSketchfabRawModel(json);
  if (!raw) return null;
  return normalizeSketchfabModel(raw);
}

/**
 * Server-only: looks up one Sketchfab model by id via the public
 * `GET /v3/models/{uid}` endpoint (confirmed live, unauthenticated, same
 * response shape as one `/v3/search` result entry).
 *
 * Needed because Sketchfab has no "browse the whole catalog" endpoint the
 * way Poly Haven does — so a favorited Sketchfab asset can't be recovered
 * from an empty-text search the way a favorited Poly Haven asset can. This
 * lets the Favorites page resolve a saved Sketchfab id directly instead.
 *
 * Returns null (never throws) for a 404 or any malformed response — a
 * missing/deleted upstream model just means that favorite can't be shown,
 * not a page-level error.
 */
export async function fetchSketchfabModelById(uid: string): Promise<AssetSearchResult | null> {
  const url = `${SKETCHFAB_API_BASE}/models/${encodeURIComponent(uid)}`;
  const headers = buildHeaders();

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new SketchfabUpstreamError(`Sketchfab request ${reason}.`);
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new SketchfabUpstreamError(`Sketchfab responded with status ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new SketchfabUpstreamError("Sketchfab returned a response we couldn't parse.");
  }

  return parseAndNormalizeModel(json);
}
