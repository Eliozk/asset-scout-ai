/**
 * Raw ambientCG `/api/v2/full_json` response shape, verified directly
 * against the live public API (2026-07) — search is publicly accessible
 * with no key. Deliberately separate from AssetSearchResult: the rest of
 * the app must never see this shape, only the normalized domain model
 * produced by normalize.ts.
 *
 * Only "Material" and "HDRI" dataType values are accepted here — ambientCG's
 * documented `type` query-param filter (docs.ambientcg.com/api/v2/full_json/
 * lists 3DModel/Atlas/Brush/Decal/HDRI/Material/PlainTexture/Substance/Terrain
 * as valid values) was confirmed LIVE to silently no-op for any value that
 * currently has zero real matches (e.g. "3DModel" returns the same
 * unfiltered 2869-result total as no filter at all, rather than 0 results),
 * so results are filtered by the asset's own `dataType` field here instead
 * of trusting the query param to have actually restricted anything.
 */

const ACCEPTED_DATA_TYPES = ["Material", "HDRI"] as const;
export type AmbientCGDataType = (typeof ACCEPTED_DATA_TYPES)[number];

export interface AmbientCGRawAsset {
  readonly assetId: string;
  readonly displayName: string;
  readonly dataType: AmbientCGDataType;
  readonly tags: readonly string[];
  readonly shortLink: string;
  readonly downloadCount?: number;
  readonly releaseDate?: string;
  /** Keyed by size/format, e.g. "512-PNG", "1024-JPG-FFFFFF" — pickThumbnail in normalize.ts selects one. */
  readonly previewImage: Readonly<Record<string, string>>;
}

export type AmbientCGSearchResponse = Readonly<Record<string, unknown>>;

const TRUSTED_SHORTLINK_PREFIX = "https://ambientcg.com/";
const TRUSTED_IMAGE_HOST = "acg-media.struffelproductions.com";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isAcceptedDataType(value: unknown): value is AmbientCGDataType {
  return typeof value === "string" && (ACCEPTED_DATA_TYPES as readonly string[]).includes(value);
}

function parsePreviewImage(value: unknown): Readonly<Record<string, string>> | null {
  if (!isRecord(value)) return null;
  const entries: [string, string][] = [];
  for (const [key, url] of Object.entries(value)) {
    if (typeof url !== "string") continue;
    if (!url.startsWith(`https://${TRUSTED_IMAGE_HOST}/`)) continue;
    entries.push([key, url]);
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

/**
 * Validates one raw asset object from `foundAssets`. Returns null (never
 * throws) for anything malformed, or for any dataType outside
 * ACCEPTED_DATA_TYPES — ambientCG hosts several other asset kinds (Decal,
 * Atlas, Substance, Terrain, Brush, PlainTexture) that this app doesn't have
 * a confident normalized mapping for yet, so they're skipped rather than
 * force-mapped into a misleading AssetType.
 */
export function parseAmbientCGRawAsset(value: unknown): AmbientCGRawAsset | null {
  if (!isRecord(value)) return null;

  const { assetId, displayName, dataType, tags, shortLink } = value;

  if (typeof assetId !== "string" || assetId.trim() === "") return null;
  if (typeof displayName !== "string" || displayName.trim() === "") return null;
  if (!isAcceptedDataType(dataType)) return null;
  if (typeof shortLink !== "string" || !shortLink.startsWith(TRUSTED_SHORTLINK_PREFIX)) return null;
  if (!isStringArray(tags)) return null;

  const previewImage = parsePreviewImage(value.previewImage);
  if (!previewImage) return null;

  return {
    assetId,
    displayName,
    dataType,
    tags,
    shortLink,
    downloadCount: typeof value.downloadCount === "number" ? value.downloadCount : undefined,
    releaseDate: typeof value.releaseDate === "string" ? value.releaseDate : undefined,
    previewImage,
  };
}

export function isAmbientCGSearchResponse(value: unknown): value is AmbientCGSearchResponse {
  return isRecord(value) && Array.isArray((value as Record<string, unknown>).foundAssets);
}
