import type { AssetSearchResult } from "@/domain/asset";
import { parseKenneyFeedXml } from "./parse-feed";
import { normalizeKenneyItem } from "./normalize";

const KENNEY_FEED_URL = "https://kenney.nl/feed";
const USER_AGENT = "AssetScoutAI/1.0 (game asset search portfolio project)";
const UPSTREAM_TIMEOUT_MS = 8_000;

export interface KenneyCatalogResult {
  readonly assets: readonly AssetSearchResult[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

export class KenneyFeedError extends Error {}

/**
 * Dev-time only: fetches Kenney's official public RSS feed. Never called at
 * request time or from client code — only from
 * scripts/generate-kenney-catalog.mts, which writes the result to a
 * versioned static JSON file the app actually queries (see provider.ts).
 * This keeps "query it without network latency at search time" literally
 * true: the live app never calls kenney.nl at all.
 */
export async function fetchKenneyFeedXml(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(KENNEY_FEED_URL, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "was unreachable";
    throw new KenneyFeedError(`Kenney feed request ${reason}.`);
  }

  if (!response.ok) {
    throw new KenneyFeedError(`Kenney feed responded with status ${response.status}.`);
  }

  return response.text();
}

/**
 * Pure: parses+normalizes a raw feed XML string. Split out from
 * fetchKenneyCatalog so "malformed entries get skipped, not thrown" is
 * unit-testable without touching the network.
 */
export function parseAndNormalizeFeed(xml: string): KenneyCatalogResult {
  const { items, totalUpstream, skipped } = parseKenneyFeedXml(xml);
  return { assets: items.map(normalizeKenneyItem), totalUpstream, skipped };
}

/** Dev-time only: fetches and normalizes the full current feed in one call. */
export async function fetchKenneyCatalog(): Promise<KenneyCatalogResult> {
  const xml = await fetchKenneyFeedXml();
  return parseAndNormalizeFeed(xml);
}
