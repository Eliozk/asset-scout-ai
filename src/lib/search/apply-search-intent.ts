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
 *
 * `intent.engines` is deliberately NEVER applied to `filters.engine`. Every
 * current live/normalized provider (src/lib/providers/*\/normalize.ts) sets
 * `engines: ["Engine-agnostic"]` unconditionally — none populates a real
 * per-asset "Unity"/"Unreal"/"Godot" value — and the engine filter
 * (lib/search/filter.ts's matchesAnyOf) requires an exact literal match, so
 * an engine-specific filter can currently only ever zero out the entire
 * catalog, never narrow it usefully. This was found live: Gemini correctly
 * inferred engines: ["Unity"] from "...for a Unity mobile game" for both the
 * English and Hebrew test queries, and applying it produced 0 results for
 * an otherwise perfectly reasonable search. Revisit this once a provider
 * populates real engine-compatibility data.
 *
 * `intent.platforms` is, for the identical reason, deliberately NEVER
 * applied to `contextTags`. `matchesContextTags` (lib/search/filter.ts)
 * requires every context tag to literally appear in `asset.tags` — a real
 * requirement the ProjectChips quick-filter UI satisfies on purpose (its
 * "Unity"/"URP"/"Mobile" chips push the literal strings "unity"/"urp"/
 * "mobile"), but real provider tag data (verified live: a Sketchfab "Police
 * Car" result's own tags — "police", "vehicle", "lowpoly", "cop", "old",
 * etc. — never include a generic platform word like "mobile") essentially
 * never contains it. Gemini inferring platforms: ["mobile"] from "...for a
 * Unity mobile game" and applying it as a required tag reproduced the exact
 * same 0-result failure as the engine filter did, live, for both the
 * English and Hebrew test queries.
 */
export function applySearchIntent(query: AssetSearchQuery, intent: SearchIntent): AssetSearchQuery {
  const filters = query.filters;

  const nextCategory = query.category === "all" && intent.dimension !== "all" ? intent.dimension : query.category;

  const nextAssetType = filters.assetType.length === 0 && intent.assetTypes.length > 0 ? intent.assetTypes : filters.assetType;

  const nextStyle = filters.style.length === 0 && intent.styles.length > 0 ? intent.styles : filters.style;

  const nextPricing =
    filters.pricing === "all" && intent.freeOnly !== null ? (intent.freeOnly ? "free" : "paid") : filters.pricing;

  return {
    ...query,
    text: intent.normalizedQuery,
    category: nextCategory,
    filters: {
      ...filters,
      assetType: nextAssetType,
      style: nextStyle,
      pricing: nextPricing,
    },
  };
}
