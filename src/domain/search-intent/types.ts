import type { AssetCategory, AssetStyle, AssetType, EngineCompatibility } from "@/domain/asset";

/**
 * Structured, validated interpretation of a natural-language search query —
 * produced either by Gemini (src/lib/gemini) or, when Gemini is unavailable,
 * never produced at all (callers fall back to the existing local query path
 * untouched). Every enum field is a strict subset of the SAME enums the rest
 * of the domain already uses (src/domain/asset/types.ts) — Gemini is never
 * allowed to invent a new asset type, engine, or style.
 *
 * This is a query-understanding artifact only. It never carries a provider
 * id, URL, thumbnail, price, or license — those only ever come from a real
 * provider response (see AGENTS.md).
 */
export const SUPPORTED_QUERY_LANGUAGES = ["en", "he", "other"] as const;
export type SupportedQueryLanguage = (typeof SUPPORTED_QUERY_LANGUAGES)[number];

/**
 * Small, deliberately generic platform vocabulary distinct from
 * EngineCompatibility (Unity/Unreal/Godot are engines, not platforms) — kept
 * narrow so Gemini can't invent an arbitrary open-ended tag.
 */
export const SEARCH_INTENT_PLATFORMS = ["mobile", "desktop", "console", "web", "vr"] as const;
export type SearchIntentPlatform = (typeof SEARCH_INTENT_PLATFORMS)[number];

export interface SearchIntent {
  /** English, used for provider search + relevance/embedding — never shown as the visible search box value. */
  readonly normalizedQuery: string;
  readonly meaningfulKeywords: readonly string[];
  readonly dimension: AssetCategory | "all";
  readonly assetTypes: readonly AssetType[];
  readonly engines: readonly EngineCompatibility[];
  readonly styles: readonly AssetStyle[];
  readonly platforms: readonly SearchIntentPlatform[];
  readonly freeOnly: boolean | null;
  readonly originalLanguage: SupportedQueryLanguage;
  /** Short, factual, length-capped — never a marketing claim about what was searched. */
  readonly interpretationSummary: string;
}

/** Strict length/count bounds enforced both in the Gemini response schema and again at validation time. */
export const SEARCH_INTENT_LIMITS = {
  /** Matches the raw input cap applied before a query is ever sent to Gemini. */
  MAX_INPUT_QUERY_LENGTH: 300,
  MAX_NORMALIZED_QUERY_LENGTH: 300,
  MAX_KEYWORDS: 12,
  MAX_KEYWORD_LENGTH: 40,
  MAX_INTERPRETATION_SUMMARY_LENGTH: 160,
} as const;
