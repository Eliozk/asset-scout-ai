/**
 * Raw shape of one hit from Pixabay's official public image API
 * (GET https://pixabay.com/api/), verified directly against Pixabay's own
 * published documentation and example response at
 * https://pixabay.com/api/docs/ (fetched live, 2026-07 — that page is a
 * plain server-rendered document, not scraped HTML content; it's the
 * official API reference itself).
 *
 * Deliberately does NOT include fullHDURL / imageURL / vectorURL — Pixabay's
 * docs state those three keys are "only available if your account has been
 * approved for full API access," a separate approval process we haven't
 * requested (per the constraint against creating accounts/keys on the
 * user's behalf) and can't assume is granted. Everything here is available
 * to any plain API key.
 */

export interface PixabayRawHit {
  readonly id: number;
  readonly pageURL: string;
  /** Observed values: "photo", "illustration", "vector". Treated as an open string — an unrecognized value still normalizes safely (see normalize.ts). */
  readonly type: string;
  /** Comma-separated tag string — Pixabay has no separate title field; this is the only descriptive text an image has. */
  readonly tags: string;
  readonly previewURL: string;
  readonly webformatURL: string;
  readonly webformatWidth?: number;
  readonly webformatHeight?: number;
  readonly largeImageURL?: string;
  readonly imageWidth?: number;
  readonly imageHeight?: number;
  readonly views?: number;
  readonly downloads?: number;
  readonly user: string;
}

export interface PixabaySearchResponse {
  readonly total: number;
  readonly totalHits: number;
  readonly hits: readonly PixabayRawHit[];
}

const TRUSTED_PAGE_PREFIX = "https://pixabay.com/";
const TRUSTED_IMAGE_HOSTS = ["https://cdn.pixabay.com/", "https://pixabay.com/get/"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrustedImageUrl(value: unknown): value is string {
  return typeof value === "string" && TRUSTED_IMAGE_HOSTS.some((prefix) => value.startsWith(prefix));
}

/**
 * Validates one raw hit from a `/api/` search response. Returns null (never
 * throws) for anything malformed or hosted somewhere untrusted, so a single
 * bad entry can't take down the whole result list.
 */
export function parsePixabayRawHit(value: unknown): PixabayRawHit | null {
  if (!isRecord(value)) return null;

  const { id, pageURL, type, tags, previewURL, webformatURL, largeImageURL, user } = value;

  if (typeof id !== "number") return null;
  if (typeof pageURL !== "string" || !pageURL.startsWith(TRUSTED_PAGE_PREFIX)) return null;
  if (typeof type !== "string" || type.trim() === "") return null;
  if (typeof tags !== "string") return null;
  if (!isTrustedImageUrl(previewURL)) return null;
  if (!isTrustedImageUrl(webformatURL)) return null;
  if (typeof user !== "string" || user.trim() === "") return null;

  return {
    id,
    pageURL,
    type,
    tags,
    previewURL,
    webformatURL,
    webformatWidth: typeof value.webformatWidth === "number" ? value.webformatWidth : undefined,
    webformatHeight: typeof value.webformatHeight === "number" ? value.webformatHeight : undefined,
    largeImageURL: isTrustedImageUrl(largeImageURL) ? largeImageURL : undefined,
    imageWidth: typeof value.imageWidth === "number" ? value.imageWidth : undefined,
    imageHeight: typeof value.imageHeight === "number" ? value.imageHeight : undefined,
    views: typeof value.views === "number" ? value.views : undefined,
    downloads: typeof value.downloads === "number" ? value.downloads : undefined,
    user,
  };
}

export function isPixabaySearchResponse(value: unknown): value is PixabaySearchResponse {
  return isRecord(value) && Array.isArray(value.hits);
}

/** Splits Pixabay's comma-separated tag string into individual lowercase tags. */
export function splitPixabayTags(tags: string): readonly string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}
