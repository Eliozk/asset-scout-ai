import type { AssetSearchResult } from "@/domain/asset";

export interface PolyHavenCatalogManifest {
  readonly sourceUrl: string;
  readonly generatedAt: string;
  /** Deterministic hash of the id set — see lib/semantic/catalog-version.ts (reused as-is, not Poly-Haven-specific). */
  readonly catalogVersion: string;
  readonly count: number;
  readonly totalUpstream: number;
  readonly skipped: number;
  readonly license: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Defensive structural check on one already-generated catalog entry. The
 * generation script only ever writes entries produced by
 * normalizePolyHavenAsset, so this should always pass — it exists so a
 * hand-edited or corrupted committed catalog.json can never crash the app,
 * only degrade to fewer (or zero, triggering the live-fetch fallback — see
 * fetch-assets.ts) Poly Haven results.
 */
export function isValidPolyHavenCatalogEntry(value: unknown): value is AssetSearchResult {
  if (!isRecord(value)) return false;
  const { id, name, source, license, externalUrl } = value;
  return (
    typeof id === "string" &&
    id.startsWith("polyhaven:") &&
    typeof name === "string" &&
    name.trim() !== "" &&
    source === "polyhaven" &&
    license === "CC0" &&
    typeof externalUrl === "string" &&
    externalUrl.startsWith("https://polyhaven.com/a/")
  );
}

/** Never throws: an unexpected shape (not an array, or an array of garbage) just yields an empty catalog. */
export function validatePolyHavenCatalog(value: unknown): readonly AssetSearchResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidPolyHavenCatalogEntry);
}

export function isValidPolyHavenCatalogManifest(value: unknown): value is PolyHavenCatalogManifest {
  if (!isRecord(value)) return false;
  const { sourceUrl, generatedAt, catalogVersion, count, totalUpstream, skipped, license } = value;
  return (
    typeof sourceUrl === "string" &&
    typeof generatedAt === "string" &&
    typeof catalogVersion === "string" &&
    typeof count === "number" &&
    typeof totalUpstream === "number" &&
    typeof skipped === "number" &&
    typeof license === "string"
  );
}
