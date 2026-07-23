import { ASSET_CATEGORIES, ASSET_STYLES, ASSET_TYPES, ENGINE_COMPATIBILITIES } from "@/domain/asset";
import type { AssetCategory, AssetStyle, AssetType, EngineCompatibility } from "@/domain/asset";
import {
  SEARCH_INTENT_LIMITS,
  SEARCH_INTENT_PLATFORMS,
  SUPPORTED_QUERY_LANGUAGES,
  type SearchIntent,
  type SearchIntentPlatform,
  type SupportedQueryLanguage,
} from "@/domain/search-intent";

/**
 * Pure, network-free validation of Gemini's raw JSON output into a trusted
 * SearchIntent. Deliberately re-validates every field from scratch rather
 * than trusting responseSchema alone — a schema-conforming response can
 * still contain whitespace-only strings, an empty normalizedQuery, or (if
 * the schema mechanism itself is ever bypassed by an SDK/model quirk) an
 * unlisted enum value. Any single problem rejects the WHOLE response — this
 * app only ever uses a fully-valid SearchIntent or none at all, never a
 * partially-trusted one.
 *
 * The raw query text itself is treated as untrusted DATA throughout — it is
 * never interpreted as an instruction to this function, and nothing here
 * executes, evaluates, or forwards it as anything other than a string.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && normalizeWhitespace(value) !== "";
}

function parseEnumArray<T extends string>(value: unknown, allowed: readonly T[]): readonly T[] | null {
  if (!Array.isArray(value)) return null;
  const allowedSet = new Set<string>(allowed);
  const result: T[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null; // reject unknown shape outright, never silently coerce
    if (!allowedSet.has(entry)) return null; // reject any value outside the existing domain enum
    result.push(entry as T);
  }
  return result;
}

function parseKeywords(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null;
    const cleaned = normalizeWhitespace(entry);
    if (cleaned === "") continue;
    if (cleaned.length > SEARCH_INTENT_LIMITS.MAX_KEYWORD_LENGTH) continue;
    result.push(cleaned);
    if (result.length >= SEARCH_INTENT_LIMITS.MAX_KEYWORDS) break;
  }
  return result;
}

/**
 * Validates one raw Gemini JSON response object. Returns null (never
 * throws) for anything malformed — the caller treats a null result exactly
 * like any other Gemini-unavailable reason and falls back to local search.
 */
export function validateSearchIntent(value: unknown): SearchIntent | null {
  if (!isRecord(value)) return null;

  const {
    normalizedQuery,
    meaningfulKeywords,
    dimension,
    assetTypes,
    engines,
    styles,
    platforms,
    freeOnly,
    originalLanguage,
    interpretationSummary,
  } = value;

  if (!isNonEmptyString(normalizedQuery)) return null;
  const cleanedNormalizedQuery = normalizeWhitespace(normalizedQuery);
  if (cleanedNormalizedQuery.length > SEARCH_INTENT_LIMITS.MAX_NORMALIZED_QUERY_LENGTH) return null;

  const cleanedKeywords = parseKeywords(meaningfulKeywords);
  if (cleanedKeywords === null) return null;

  if (typeof dimension !== "string") return null;
  const allowedDimensions: readonly (AssetCategory | "all")[] = ["all", ...ASSET_CATEGORIES];
  if (!allowedDimensions.includes(dimension as AssetCategory | "all")) return null;

  const cleanedAssetTypes = parseEnumArray<AssetType>(assetTypes, ASSET_TYPES);
  if (cleanedAssetTypes === null) return null;

  const cleanedEngines = parseEnumArray<EngineCompatibility>(engines, ENGINE_COMPATIBILITIES);
  if (cleanedEngines === null) return null;

  const cleanedStyles = parseEnumArray<AssetStyle>(styles, ASSET_STYLES);
  if (cleanedStyles === null) return null;

  const cleanedPlatforms = parseEnumArray<SearchIntentPlatform>(platforms, SEARCH_INTENT_PLATFORMS);
  if (cleanedPlatforms === null) return null;

  if (freeOnly !== null && typeof freeOnly !== "boolean") return null;

  if (typeof originalLanguage !== "string") return null;
  if (!(SUPPORTED_QUERY_LANGUAGES as readonly string[]).includes(originalLanguage)) return null;

  if (!isNonEmptyString(interpretationSummary)) return null;
  const cleanedSummary = normalizeWhitespace(interpretationSummary).slice(
    0,
    SEARCH_INTENT_LIMITS.MAX_INTERPRETATION_SUMMARY_LENGTH,
  );

  return {
    normalizedQuery: cleanedNormalizedQuery,
    meaningfulKeywords: cleanedKeywords,
    dimension: dimension as AssetCategory | "all",
    assetTypes: cleanedAssetTypes,
    engines: cleanedEngines,
    styles: cleanedStyles,
    platforms: cleanedPlatforms,
    freeOnly: freeOnly as boolean | null,
    originalLanguage: originalLanguage as SupportedQueryLanguage,
    interpretationSummary: cleanedSummary,
  };
}

/**
 * Validates and clamps the RAW user query before it is ever sent to Gemini —
 * the strict input-length limit applies to what we send, not just what
 * Gemini sends back. Returns null for an empty/whitespace-only query.
 */
export function prepareRawQueryForGemini(rawText: string): string | null {
  const cleaned = normalizeWhitespace(rawText);
  if (cleaned === "") return null;
  return cleaned.slice(0, SEARCH_INTENT_LIMITS.MAX_INPUT_QUERY_LENGTH);
}
