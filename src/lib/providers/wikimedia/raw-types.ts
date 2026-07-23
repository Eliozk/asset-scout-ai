/**
 * Raw Wikimedia Commons MediaWiki Action API response shape
 * (action=query&generator=search&gsrnamespace=6&prop=imageinfo), verified
 * directly against the live public API (2026-07) — no key required, only a
 * descriptive User-Agent header per mediawiki.org/wiki/API:Etiquette.
 * Deliberately separate from AssetSearchResult: the rest of the app must
 * never see this shape, only the normalized domain model produced by
 * normalize.ts.
 */

export interface WikimediaRawExtMetadataField {
  readonly value: string;
}

export interface WikimediaRawImageInfo {
  readonly thumburl: string;
  readonly url: string;
  readonly descriptionurl: string;
  readonly width?: number;
  readonly height?: number;
  readonly extmetadata?: Readonly<Record<string, WikimediaRawExtMetadataField>>;
}

export interface WikimediaRawPage {
  readonly pageid: number;
  /** Always "File:<name>.<ext>" for a namespace-6 (File) search result. */
  readonly title: string;
  readonly imageinfo: readonly WikimediaRawImageInfo[];
}

export type WikimediaQueryResponse = Readonly<Record<string, unknown>>;

const TRUSTED_UPLOAD_HOST_PREFIX = "https://upload.wikimedia.org/";
const TRUSTED_DESCRIPTION_PREFIX = "https://commons.wikimedia.org/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseExtMetadata(value: unknown): Readonly<Record<string, WikimediaRawExtMetadataField>> | undefined {
  if (!isRecord(value)) return undefined;
  const entries: [string, WikimediaRawExtMetadataField][] = [];
  for (const [key, field] of Object.entries(value)) {
    if (isRecord(field) && typeof field.value === "string") {
      entries.push([key, { value: field.value }]);
    }
  }
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function parseImageInfoEntry(value: unknown): WikimediaRawImageInfo | null {
  if (!isRecord(value)) return null;
  const { thumburl, url, descriptionurl, width, height } = value;

  if (typeof thumburl !== "string" || !thumburl.startsWith(TRUSTED_UPLOAD_HOST_PREFIX)) return null;
  if (typeof url !== "string" || !url.startsWith(TRUSTED_UPLOAD_HOST_PREFIX)) return null;
  if (typeof descriptionurl !== "string" || !descriptionurl.startsWith(TRUSTED_DESCRIPTION_PREFIX)) return null;

  return {
    thumburl,
    url,
    descriptionurl,
    width: typeof width === "number" ? width : undefined,
    height: typeof height === "number" ? height : undefined,
    extmetadata: parseExtMetadata(value.extmetadata),
  };
}

/**
 * Validates one raw page object from `query.pages`. Returns null (never
 * throws) for anything malformed so a single bad upstream record can't take
 * down the whole result list.
 */
export function parseWikimediaRawPage(value: unknown): WikimediaRawPage | null {
  if (!isRecord(value)) return null;

  const { pageid, title, imageinfo } = value;
  if (typeof pageid !== "number") return null;
  if (typeof title !== "string" || !title.startsWith("File:")) return null;
  if (!Array.isArray(imageinfo) || imageinfo.length === 0) return null;

  const firstEntry = parseImageInfoEntry(imageinfo[0]);
  if (!firstEntry) return null;

  return { pageid, title, imageinfo: [firstEntry] };
}

/**
 * fetch-assets.ts always requests `formatversion=2`, under which
 * `query.pages` is a plain ARRAY of page objects — verified live. (The
 * legacy default, formatversion=1, keys pages by pageid as an object
 * instead; this app never requests that shape, so it's not supported here.)
 */
export function isWikimediaQueryResponse(value: unknown): value is WikimediaQueryResponse {
  if (!isRecord(value)) return false;
  const query = value.query;
  return isRecord(query) && Array.isArray(query.pages);
}

export function extractPages(response: WikimediaQueryResponse): readonly unknown[] {
  const query = (response as { query?: unknown }).query;
  if (!isRecord(query) || !Array.isArray(query.pages)) return [];
  return query.pages;
}
