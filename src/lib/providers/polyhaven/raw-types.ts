/**
 * Raw Poly Haven `/assets` response shape, verified directly against the
 * live API (2026-07). Deliberately kept separate from AssetSearchResult: the
 * rest of the app must never see this shape, only the normalized domain
 * model produced by normalize.ts.
 *
 * Poly Haven's public API has no official published schema/SDK, so this is a
 * minimal manual parser rather than a generated type — the external response
 * is untrusted input and every field is validated before use.
 */

export const POLY_HAVEN_TYPE_HDRI = 0;
export const POLY_HAVEN_TYPE_TEXTURE = 1;
export const POLY_HAVEN_TYPE_MODEL = 2;

export interface PolyHavenRawAsset {
  readonly type: 0 | 1 | 2;
  readonly name: string;
  readonly description: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly authors: Readonly<Record<string, string>>;
  readonly date_published?: number;
  readonly download_count?: number;
  readonly thumbnail_url: string;
  readonly max_resolution?: readonly number[];
  readonly dimensions?: readonly number[];
  readonly polycount?: number;
  readonly lods?: boolean;
  readonly nsfw?: boolean;
}

/** The full `/assets` response: a map of asset id (slug) -> raw asset. */
export type PolyHavenAssetsResponse = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

function isAuthorsMap(value: unknown): value is Readonly<Record<string, string>> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

/**
 * Validates one raw dict entry from `/assets`. Returns null (never throws)
 * for anything malformed so a single bad upstream record can't take down the
 * whole result list.
 */
export function parsePolyHavenRawAsset(value: unknown): PolyHavenRawAsset | null {
  if (!isRecord(value)) return null;

  const { type, name, description, categories, tags, authors, thumbnail_url: thumbnailUrl } = value;

  if (type !== 0 && type !== 1 && type !== 2) return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof thumbnailUrl !== "string" || !thumbnailUrl.startsWith("https://cdn.polyhaven.com/")) return null;
  if (!isStringArray(categories)) return null;
  if (!isStringArray(tags)) return null;
  if (!isAuthorsMap(authors)) return null;

  if (value.nsfw === true) return null;

  const maxResolution = isNumberArray(value.max_resolution) ? value.max_resolution : undefined;
  const dimensions = isNumberArray(value.dimensions) ? value.dimensions : undefined;

  return {
    type,
    name,
    description: typeof description === "string" ? description : "",
    categories,
    tags,
    authors,
    date_published: typeof value.date_published === "number" ? value.date_published : undefined,
    download_count: typeof value.download_count === "number" ? value.download_count : undefined,
    thumbnail_url: thumbnailUrl,
    max_resolution: maxResolution,
    dimensions,
    polycount: typeof value.polycount === "number" ? value.polycount : undefined,
    lods: typeof value.lods === "boolean" ? value.lods : undefined,
    nsfw: false,
  };
}

export function isPolyHavenAssetsResponse(value: unknown): value is PolyHavenAssetsResponse {
  return isRecord(value);
}
