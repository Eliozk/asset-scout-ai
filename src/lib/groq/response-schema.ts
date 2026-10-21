import { ASSET_CATEGORIES, ASSET_STYLES, ASSET_TYPES, ENGINE_COMPATIBILITIES } from "@/domain/asset";
import { SEARCH_INTENT_PLATFORMS, SUPPORTED_QUERY_LANGUAGES } from "@/domain/search-intent";
import { GEMINI_SEARCH_INTENT_SCHEMA } from "@/lib/gemini/response-schema";

const geminiProps = GEMINI_SEARCH_INTENT_SCHEMA.properties;

/**
 * The same SearchIntent shape as GEMINI_SEARCH_INTENT_SCHEMA, as standard JSON
 * Schema for Groq's strict structured outputs (console.groq.com/docs/structured-outputs).
 * Strict mode needs `additionalProperties: false`, every field in `required`,
 * and nullability as a type union instead of Gemini's `nullable: true`.
 * Enums and descriptions come from the same domain constants / Gemini schema,
 * so the two providers can't drift apart. validate-intent.ts still re-checks
 * every field — this is a shape constraint, not a trust boundary.
 */
export const GROQ_SEARCH_INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    normalizedQuery: { type: "string", description: geminiProps.normalizedQuery.description },
    meaningfulKeywords: {
      type: "array",
      items: { type: "string" },
      description: geminiProps.meaningfulKeywords.description,
    },
    dimension: { type: "string", enum: ["all", ...ASSET_CATEGORIES] },
    assetTypes: { type: "array", items: { type: "string", enum: [...ASSET_TYPES] } },
    engines: { type: "array", items: { type: "string", enum: [...ENGINE_COMPATIBILITIES] } },
    styles: { type: "array", items: { type: "string", enum: [...ASSET_STYLES] } },
    platforms: { type: "array", items: { type: "string", enum: [...SEARCH_INTENT_PLATFORMS] } },
    freeOnly: { type: ["boolean", "null"], description: geminiProps.freeOnly.description },
    originalLanguage: { type: "string", enum: [...SUPPORTED_QUERY_LANGUAGES] },
    interpretationSummary: { type: "string", description: geminiProps.interpretationSummary.description },
  },
  required: [...GEMINI_SEARCH_INTENT_SCHEMA.required],
} as const;
