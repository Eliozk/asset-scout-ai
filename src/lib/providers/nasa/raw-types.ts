/**
 * Raw NASA Image and Video Library API response shape
 * (images-api.nasa.gov/search), verified directly against the live public
 * API (2026-07) — no key required for this specific endpoint (distinct from
 * the separate DEMO_KEY-gated api.nasa.gov platform). Deliberately separate
 * from AssetSearchResult: the rest of the app must never see this shape,
 * only the normalized domain model produced by normalize.ts.
 */

export interface NasaRawItemData {
  readonly nasa_id: string;
  readonly title: string;
  readonly description?: string;
  readonly date_created?: string;
  readonly keywords?: readonly string[];
  readonly secondary_creator?: string;
  readonly center?: string;
  readonly media_type: string;
}

export interface NasaRawLink {
  readonly href: string;
  readonly rel: string;
  readonly width?: number;
  readonly height?: number;
}

export interface NasaRawItem {
  readonly data: NasaRawItemData;
  readonly links: readonly NasaRawLink[];
}

export type NasaSearchResponse = Readonly<Record<string, unknown>>;

const TRUSTED_ASSET_HOST_PREFIX = "https://images-assets.nasa.gov/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function parseLink(value: unknown): NasaRawLink | null {
  if (!isRecord(value)) return null;
  const { href, rel, width, height } = value;
  if (typeof href !== "string" || !href.startsWith(TRUSTED_ASSET_HOST_PREFIX)) return null;
  if (typeof rel !== "string") return null;
  return {
    href,
    rel,
    width: typeof width === "number" ? width : undefined,
    height: typeof height === "number" ? height : undefined,
  };
}

function parseItemData(value: unknown): NasaRawItemData | null {
  if (!isRecord(value)) return null;
  const { nasa_id: nasaId, title, media_type: mediaType } = value;
  if (typeof nasaId !== "string" || nasaId.trim() === "") return null;
  if (typeof title !== "string" || title.trim() === "") return null;
  if (mediaType !== "image") return null; // this app only shows images — audio/video items are skipped

  return {
    nasa_id: nasaId,
    title,
    description: typeof value.description === "string" ? value.description : undefined,
    date_created: typeof value.date_created === "string" ? value.date_created : undefined,
    keywords: isStringArray(value.keywords) ? value.keywords : undefined,
    secondary_creator: typeof value.secondary_creator === "string" ? value.secondary_creator : undefined,
    center: typeof value.center === "string" ? value.center : undefined,
    media_type: mediaType,
  };
}

/**
 * Validates one raw item object from `collection.items`. Returns null
 * (never throws) for anything malformed so a single bad upstream record
 * can't take down the whole result list.
 */
export function parseNasaRawItem(value: unknown): NasaRawItem | null {
  if (!isRecord(value)) return null;

  const data = Array.isArray(value.data) ? parseItemData(value.data[0]) : null;
  if (!data) return null;

  if (!Array.isArray(value.links)) return null;
  const links: NasaRawLink[] = [];
  for (const entry of value.links) {
    const parsed = parseLink(entry);
    if (parsed) links.push(parsed);
  }
  if (links.length === 0) return null;

  return { data, links };
}

export function isNasaSearchResponse(value: unknown): value is NasaSearchResponse {
  if (!isRecord(value)) return false;
  const collection = value.collection;
  return isRecord(collection) && Array.isArray(collection.items);
}

export function extractItems(response: NasaSearchResponse): readonly unknown[] {
  const collection = (response as { collection?: unknown }).collection;
  if (!isRecord(collection) || !Array.isArray(collection.items)) return [];
  return collection.items;
}
