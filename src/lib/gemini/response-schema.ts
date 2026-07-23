import { ASSET_CATEGORIES, ASSET_STYLES, ASSET_TYPES, ENGINE_COMPATIBILITIES } from "@/domain/asset";
import { SEARCH_INTENT_LIMITS, SEARCH_INTENT_PLATFORMS, SUPPORTED_QUERY_LANGUAGES } from "@/domain/search-intent";

/**
 * OpenAPI-3.0-style JSON schema passed to Gemini as `responseSchema` (see
 * ai.google.dev/gemini-api/docs/generate-content/structured-output) so the
 * model is constrained to emit exactly this shape — never free-form text,
 * never an unlisted enum value. Every enum array here is built directly FROM
 * the same domain constants normalize.ts/filter.ts already use, so this
 * schema can never silently drift from what the rest of the app considers a
 * valid AssetType/EngineCompatibility/AssetStyle.
 *
 * This is deliberately just a shape constraint, not a trust boundary by
 * itself — validate-intent.ts re-validates every field from scratch, because
 * a model can still emit a technically-schema-valid response that's
 * otherwise malformed (e.g. whitespace-only strings).
 */
export const GEMINI_SEARCH_INTENT_SCHEMA = {
  type: "object",
  properties: {
    normalizedQuery: {
      type: "string",
      description:
        "The user's request translated/rewritten into a short, clear English search phrase suitable for a keyword search API. Never invent details not implied by the original request.",
    },
    meaningfulKeywords: {
      type: "array",
      items: { type: "string" },
      description: "Up to a dozen short individual English keywords extracted from the request.",
    },
    dimension: {
      type: "string",
      enum: ["all", ...ASSET_CATEGORIES],
    },
    assetTypes: {
      type: "array",
      items: { type: "string", enum: [...ASSET_TYPES] },
    },
    engines: {
      type: "array",
      items: { type: "string", enum: [...ENGINE_COMPATIBILITIES] },
    },
    styles: {
      type: "array",
      items: { type: "string", enum: [...ASSET_STYLES] },
    },
    platforms: {
      type: "array",
      items: { type: "string", enum: [...SEARCH_INTENT_PLATFORMS] },
    },
    freeOnly: {
      type: "boolean",
      nullable: true,
      description: "true only if the user explicitly asked for free/no-cost assets, false only if they explicitly asked for paid, otherwise null.",
    },
    originalLanguage: {
      type: "string",
      enum: [...SUPPORTED_QUERY_LANGUAGES],
    },
    interpretationSummary: {
      type: "string",
      description: `A short, factual, one-sentence summary of how the request was interpreted, under ${SEARCH_INTENT_LIMITS.MAX_INTERPRETATION_SUMMARY_LENGTH} characters. Never a marketing claim.`,
    },
  },
  required: [
    "normalizedQuery",
    "meaningfulKeywords",
    "dimension",
    "assetTypes",
    "engines",
    "styles",
    "platforms",
    "freeOnly",
    "originalLanguage",
    "interpretationSummary",
  ],
} as const;
