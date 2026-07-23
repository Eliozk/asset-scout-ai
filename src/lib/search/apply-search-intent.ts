import type { AssetSearchQuery } from "@/domain/asset";
import type { SearchIntent } from "@/domain/search-intent";

/**
 * Pure merge of a validated Gemini SearchIntent into the current
 * AssetSearchQuery. Never React, never I/O — unit-tested in isolation like
 * every other query-shaping function in this directory (AGENTS.md).
 *
 * The rule throughout is uniform and simple: Gemini only ever FILLS a field
 * that is still at its own default/empty value. Any field the user has
 * already explicitly set (a non-default category, a non-empty filter array,
 * a non-"all" pricing filter, any existing context tag) is left completely
 * untouched — "explicit UI filter selections override Gemini-inferred
 * filters." `text` is the one exception: it always becomes the Gemini
 * normalizedQuery, since that's the entire point of a successful
 * interpretation (the ORIGINAL text the user typed is preserved separately,
 * for display only, by the caller — never inside AssetSearchQuery).
 *
 * Known limitation: `category === "all"` is both the untouched default AND
 * a valid explicit choice (clicking "All" in the category toggle) — the
 * domain model has no separate "touched" flag, so this function can't tell
 * them apart and will fill it from Gemini's dimension in both cases. This is
 * a deliberate, documented tradeoff, not an oversight.
 */
export function applySearchIntent(query: AssetSearchQuery, intent: SearchIntent): AssetSearchQuery {
  const filters = query.filters;

  const nextCategory = query.category === "all" && intent.dimension !== "all" ? intent.dimension : query.category;

  const nextAssetType = filters.assetType.length === 0 && intent.assetTypes.length > 0 ? intent.assetTypes : filters.assetType;

  const nextEngine = filters.engine.length === 0 && intent.engines.length > 0 ? intent.engines : filters.engine;

  const nextStyle = filters.style.length === 0 && intent.styles.length > 0 ? intent.styles : filters.style;

  const nextPricing =
    filters.pricing === "all" && intent.freeOnly !== null ? (intent.freeOnly ? "free" : "paid") : filters.pricing;

  const nextContextTags = query.contextTags.length === 0 && intent.platforms.length > 0 ? intent.platforms : query.contextTags;

  return {
    ...query,
    text: intent.normalizedQuery,
    category: nextCategory,
    contextTags: nextContextTags,
    filters: {
      ...filters,
      assetType: nextAssetType,
      engine: nextEngine,
      style: nextStyle,
      pricing: nextPricing,
    },
  };
}
