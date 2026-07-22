"use client";

import type { AssetCategory } from "@/domain/asset";
import { useAssetSearch } from "@/hooks/useAssetSearch";
import { useFavorites } from "@/hooks/useFavorites";
import { useSemanticRanking } from "@/hooks/useSemanticRanking";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { FilterDrawer } from "@/components/filters/FilterDrawer";
import { AssetGrid } from "@/components/assets/AssetGrid";
import { ResultsHeader } from "@/components/assets/ResultsHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { SearchBar } from "./SearchBar";
import { ProjectChips } from "./ProjectChips";
import { CategoryToggle } from "./CategoryToggle";
import { SemanticStatusNote } from "./SemanticStatusNote";
import { ProviderErrorBanner } from "./ProviderErrorBanner";
import { LanguageLimitationNotice } from "./LanguageLimitationNotice";
import { MarketplaceSearchHub } from "./MarketplaceSearchHub";
import { applySourceDiversity } from "@/lib/search/source-diversity";
import { containsUnsupportedScript } from "@/lib/search/query-language";

/**
 * Poly Haven's catalog is thousands of assets; an unscoped query can match
 * hundreds+. Rendering that many cards at once — each requesting a real
 * remote thumbnail — makes the page sluggish, so we cap how many mount at
 * once while still reporting the true total match count above the grid.
 */
const RESULT_RENDER_LIMIT = 60;

export function ExploreExperience() {
  const { query, setQuery, status, results, error, providerOutcomes } = useAssetSearch();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const {
    status: semanticStatus,
    ranked: semanticallyRanked,
    scoresById: semanticScoresById,
  } = useSemanticRanking(query, results);
  const unsupportedLanguage = containsUnsupportedScript(query.text);
  // Mirrors useSemanticRanking's own internal `canRank` condition: whenever AI
  // ranking is active, `semanticallyRanked` is the FULL catalog re-sorted by
  // relevance (not a filtered match count) — see that hook's doc comment.
  const aiRanked = semanticStatus === "ready" && query.sort === "best-match" && query.text.trim() !== "";

  function setCategory(category: AssetCategory | "all") {
    setQuery((current) => ({ ...current, category }));
  }

  function toggleContextTag(tag: string) {
    setQuery((current) => ({
      ...current,
      contextTags: current.contextTags.includes(tag)
        ? current.contextTags.filter((entry) => entry !== tag)
        : [...current.contextTags, tag],
    }));
  }

  function toggleCategoryChip(category: AssetCategory) {
    setQuery((current) => ({
      ...current,
      category: current.category === category ? "all" : category,
    }));
  }

  return (
    <div>
      <SearchBar value={query.text} onChange={(text) => setQuery((current) => ({ ...current, text }))} />
      <ProjectChips
        contextTags={query.contextTags}
        category={query.category}
        onToggleTag={toggleContextTag}
        onToggleCategory={toggleCategoryChip}
      />
      <div className="flex justify-center">
        <CategoryToggle value={query.category} onChange={setCategory} />
      </div>

      <SemanticStatusNote status={semanticStatus} />

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <FilterSidebar
          filters={query.filters}
          onChange={(filters) => setQuery((current) => ({ ...current, filters }))}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <FilterDrawer
              filters={query.filters}
              onChange={(filters) => setQuery((current) => ({ ...current, filters }))}
            />
          </div>

          {status !== "error" && !(status === "success" && unsupportedLanguage) && (
            <ResultsHeader
              count={semanticallyRanked.length}
              sort={query.sort}
              onSortChange={(sort) => setQuery((current) => ({ ...current, sort }))}
              aiRanked={aiRanked}
            />
          )}

          {status !== "error" && <ProviderErrorBanner providerOutcomes={providerOutcomes} />}

          <div className="mt-5">
            {status === "loading" && <LoadingState />}
            {status === "error" && (
              <ErrorState message={error ?? "Search is unavailable right now. Please try again shortly."} />
            )}
            {/*
              Unsupported-script queries are handled before the normal empty/results
              branches, and take priority even in AI-ranked mode — that mode re-sorts
              the ENTIRE catalog when the keyword filter would zero out (see
              useSemanticRanking), which would otherwise flood a Hebrew/Arabic/etc.
              query with thousands of items "ranked" by a model that (per the
              multilingual POC in poc/multilingual-hebrew-search/) has no real
              cross-lingual signal for the production English-only model.
            */}
            {status === "success" && unsupportedLanguage && (
              <>
                <LanguageLimitationNotice />
                <EmptyState
                  title="No English matches for this query"
                  description="AssetScout's catalog text and search only understand English right now. Try describing the asset in English (e.g. 'medieval sword' instead of 'חרב')."
                />
              </>
            )}
            {status === "success" && !unsupportedLanguage && semanticallyRanked.length === 0 && <EmptyState />}
            {status === "success" && !unsupportedLanguage && semanticallyRanked.length > 0 && (
              <>
                <AssetGrid
                  assets={applySourceDiversity(semanticallyRanked, RESULT_RENDER_LIMIT)}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  semanticScoresById={semanticScoresById}
                />
                {semanticallyRanked.length > RESULT_RENDER_LIMIT && (
                  <p className="mt-6 text-center text-xs text-text-faint">
                    {aiRanked
                      ? `Showing the ${RESULT_RENDER_LIMIT} most AI-relevant of ${semanticallyRanked.length} catalog items — refine your search or filters to narrow further.`
                      : `Showing the top ${RESULT_RENDER_LIMIT} of ${semanticallyRanked.length} matches — refine your search or filters to narrow further.`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MarketplaceSearchHub query={query.text} />
    </div>
  );
}
