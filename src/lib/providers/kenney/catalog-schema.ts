import type { AssetSearchResult } from "@/domain/asset";

export interface KenneyCatalogManifest {
  readonly sourceUrl: string;
  readonly generatedAt: string;
  /** Deterministic hash of the id set — see lib/semantic/catalog-version.ts (reused as-is, not Kenney-specific). */
  readonly catalogVersion: string;
  readonly count: number;
  readonly skipped: number;
  readonly license: string;
  /** Explicit, honest scope note: this is NOT Kenney's full historical catalog. */
  readonly scope: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Defensive structural check on one already-generated catalog entry. The
 * generation script only ever writes entries produced by
 * normalizeKenneyItem, so this should always pass — it exists to make sure a
 * hand-edited or corrupted committed catalog.json can never crash the app
 * or the other providers, only degrade to fewer (or zero) Kenney results.
 */
export function isValidKenneyCatalogEntry(value: unknown): value is AssetSearchResult {
  if (!isRecord(value)) return false;
  const { id, name, source, license, externalUrl } = value;
  return (
    typeof id === "string" &&
    id.startsWith("kenney:") &&
    typeof name === "string" &&
    name.trim() !== "" &&
    source === "kenney" &&
    license === "CC0" &&
    typeof externalUrl === "string" &&
    externalUrl.startsWith("https://kenney.nl/assets/")
  );
}

/** Never throws: an unexpected shape (not an array, or an array of garbage) just yields an empty catalog. */
export function validateKenneyCatalog(value: unknown): readonly AssetSearchResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidKenneyCatalogEntry);
}

export function isValidKenneyCatalogManifest(value: unknown): value is KenneyCatalogManifest {
  if (!isRecord(value)) return false;
  const { sourceUrl, generatedAt, catalogVersion, count, skipped, license, scope } = value;
  return (
    typeof sourceUrl === "string" &&
    typeof generatedAt === "string" &&
    typeof catalogVersion === "string" &&
    typeof count === "number" &&
    typeof skipped === "number" &&
    typeof license === "string" &&
    typeof scope === "string"
  );
}
