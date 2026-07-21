/**
 * Raw Sketchfab `/v3/search?type=models` response shape, verified directly
 * against the live public API (2026-07) — search is publicly accessible
 * with no token. Deliberately separate from AssetSearchResult: the rest of
 * the app must never see this shape, only the normalized domain model
 * produced by normalize.ts.
 *
 * Sketchfab's official docs (docs.sketchfab.com/data-api/v3) are a
 * JS-rendered Swagger UI that can't be statically fetched, so the exact
 * field list here was confirmed by calling the real endpoint directly and
 * inspecting real responses — the same verification approach used for
 * Poly Haven.
 */

export interface SketchfabRawThumbnailImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

export interface SketchfabRawUser {
  readonly username: string;
  readonly displayName: string;
  readonly profileUrl: string;
}

export interface SketchfabRawLicense {
  /**
   * Only present on `/v3/search` results — `/v3/models/{uid}` (used to
   * resolve a favorited asset by id) returns a differently-shaped license
   * object (`uri`/`fullName`/`slug`, no `uid`) that still has a real `label`.
   * Both were confirmed live; `label` is the only field normalize.ts reads,
   * so it's the only one required here.
   */
  readonly uid?: string;
  readonly label: string;
}

export interface SketchfabRawModel {
  readonly uid: string;
  readonly name: string;
  readonly description: string;
  readonly viewerUrl: string;
  readonly publishedAt?: string;
  readonly createdAt?: string;
  readonly tags: readonly { readonly name: string }[];
  readonly categories: readonly { readonly name: string }[];
  readonly thumbnailImages: readonly SketchfabRawThumbnailImage[];
  readonly user: SketchfabRawUser;
  readonly isDownloadable: boolean;
  readonly license: SketchfabRawLicense | null;
  readonly faceCount?: number;
  /** Archive format keys (e.g. "gltf", "glb", "source", "usdz") — real, verified, never guessed. */
  readonly archiveFormats: readonly string[];
}

export type SketchfabSearchResponse = Readonly<Record<string, unknown>>;

const TRUSTED_VIEWER_PREFIX = "https://sketchfab.com/";
const TRUSTED_THUMBNAIL_HOST = "media.sketchfab.com";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTaggedNameArray(value: unknown): value is readonly { readonly name: string }[] {
  return Array.isArray(value) && value.every((entry) => isRecord(entry) && typeof entry.name === "string");
}

function parseThumbnailImages(value: unknown): readonly SketchfabRawThumbnailImage[] | null {
  if (!isRecord(value) || !Array.isArray(value.images)) return null;
  const images: SketchfabRawThumbnailImage[] = [];
  for (const entry of value.images) {
    if (!isRecord(entry)) continue;
    const { url, width, height } = entry;
    if (typeof url !== "string" || !url.startsWith(`https://${TRUSTED_THUMBNAIL_HOST}/`)) continue;
    if (typeof width !== "number" || typeof height !== "number") continue;
    images.push({ url, width, height });
  }
  return images;
}

function parseUser(value: unknown): SketchfabRawUser | null {
  if (!isRecord(value)) return null;
  const { username, displayName, profileUrl } = value;
  if (typeof username !== "string" || username.trim() === "") return null;
  if (typeof profileUrl !== "string" || !profileUrl.startsWith(TRUSTED_VIEWER_PREFIX)) return null;
  return {
    username,
    displayName: typeof displayName === "string" && displayName.trim() !== "" ? displayName : username,
    profileUrl,
  };
}

function parseLicense(value: unknown): SketchfabRawLicense | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;
  const { uid, label } = value;
  if (typeof label !== "string") return null;
  return typeof uid === "string" ? { uid, label } : { label };
}

/**
 * Validates one raw model object from a `/v3/search` results array. Returns
 * null (never throws) for anything malformed, so a single bad upstream
 * record can't take down the whole result list. Also excludes
 * age-restricted models — not appropriate for a public portfolio app.
 */
export function parseSketchfabRawModel(value: unknown): SketchfabRawModel | null {
  if (!isRecord(value)) return null;

  const { uid, name, description, viewerUrl, tags, categories, thumbnails, user, isDownloadable, license, archives } =
    value;

  if (typeof uid !== "string" || uid.trim() === "") return null;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof viewerUrl !== "string" || !viewerUrl.startsWith(TRUSTED_VIEWER_PREFIX)) return null;
  if (value.isAgeRestricted === true) return null;

  if (!isTaggedNameArray(tags)) return null;
  if (!isTaggedNameArray(categories)) return null;

  const thumbnailImages = parseThumbnailImages(thumbnails);
  if (!thumbnailImages || thumbnailImages.length === 0) return null;

  const parsedUser = parseUser(user);
  if (!parsedUser) return null;

  if (typeof isDownloadable !== "boolean") return null;

  const archiveFormats = isRecord(archives) ? Object.keys(archives) : [];

  return {
    uid,
    name,
    description: typeof description === "string" ? description : "",
    viewerUrl,
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    tags,
    categories,
    thumbnailImages,
    user: parsedUser,
    isDownloadable,
    license: parseLicense(license),
    faceCount: typeof value.faceCount === "number" ? value.faceCount : undefined,
    archiveFormats,
  };
}

export function isSketchfabSearchResponse(value: unknown): value is SketchfabSearchResponse {
  return isRecord(value) && Array.isArray((value as Record<string, unknown>).results);
}
