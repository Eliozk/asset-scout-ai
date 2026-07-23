/**
 * Raw Openverse `/v1/images/` search response shape, verified directly
 * against the live public API (2026-07) — anonymous access works, no
 * key/registration required (heavier throttling applies without one; see
 * docs.openverse.org/api/reference/authentication_and_throttling.html).
 * Deliberately separate from AssetSearchResult: the rest of the app must
 * never see this shape, only the normalized domain model produced by
 * normalize.ts.
 */

export interface OpenverseRawResult {
  readonly id: string;
  readonly title: string;
  readonly foreign_landing_url: string;
  /** Always an api.openverse.org URL, unlike `url` (the original image, hotlinked to an arbitrary per-source host) — this is the one we hotlink. */
  readonly thumbnail: string;
  readonly creator?: string;
  readonly license: string;
  readonly license_version?: string;
  readonly attribution?: string;
  readonly tags?: readonly { readonly name: string }[];
  readonly width?: number;
  readonly height?: number;
  readonly mature: boolean;
}

export type OpenverseSearchResponse = Readonly<Record<string, unknown>>;

const TRUSTED_LANDING_HOSTS_ALLOW_ANY_HTTPS = true; // foreign_landing_url legitimately varies per source (Flickr, Wikimedia, museums, ...) — only scheme is checked, never a fixed host
const TRUSTED_THUMBNAIL_PREFIX = "https://api.openverse.org/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTaggedNameArray(value: unknown): value is readonly { readonly name: string }[] {
  return Array.isArray(value) && value.every((entry) => isRecord(entry) && typeof entry.name === "string");
}

function isHttpsUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("https://");
}

/**
 * Validates one raw result object from `results`. Returns null (never
 * throws) for anything malformed or flagged mature, so a single bad
 * upstream record can't take down the whole result list.
 */
export function parseOpenverseRawResult(value: unknown): OpenverseRawResult | null {
  if (!isRecord(value)) return null;

  const { id, title, foreign_landing_url: landingUrl, thumbnail, license, mature } = value;

  if (typeof id !== "string" || id.trim() === "") return null;
  if (typeof title !== "string" || title.trim() === "") return null;
  if (!isHttpsUrl(landingUrl) || !TRUSTED_LANDING_HOSTS_ALLOW_ANY_HTTPS) return null;
  if (typeof thumbnail !== "string" || !thumbnail.startsWith(TRUSTED_THUMBNAIL_PREFIX)) return null;
  if (typeof license !== "string" || license.trim() === "") return null;
  if (mature === true) return null; // never show mature-flagged content in a public portfolio app

  const tags = isTaggedNameArray(value.tags) ? value.tags : [];

  return {
    id,
    title,
    foreign_landing_url: landingUrl,
    thumbnail,
    creator: typeof value.creator === "string" && value.creator.trim() !== "" ? value.creator : undefined,
    license,
    license_version: typeof value.license_version === "string" ? value.license_version : undefined,
    attribution: typeof value.attribution === "string" ? value.attribution : undefined,
    tags,
    width: typeof value.width === "number" ? value.width : undefined,
    height: typeof value.height === "number" ? value.height : undefined,
    mature: false,
  };
}

export function isOpenverseSearchResponse(value: unknown): value is OpenverseSearchResponse {
  return isRecord(value) && Array.isArray((value as Record<string, unknown>).results);
}
