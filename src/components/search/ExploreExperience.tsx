"use client";

import type { AssetCategory } from "@/domain/asset";
import { useAssetSearch } from "@/hooks/useAssetSearch";
import { useFavorites } from "@/hooks/useFavorites";
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

/**
 * Poly Haven's catalog is thousands of assets; an unscoped query can match
 * hundreds+. Rendering that many cards at once — each requesting a real
 * remote thumbnail — makes the page sluggish, so we cap how many mount at
 * once while still reporting the true total match count above the grid.
 */
const RESULT_RENDER_LIMIT = 60;

export function ExploreExperience() {
  const { query, setQuery, status, results, error } = useAssetSearch();
  const { favoriteIds, toggleFavorite } = useFavorites();

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

      <p className="mx-auto mt-4 max-w-md text-center text-xs text-text-faint">
        Results are ranked by keyword, tag, and category relevance today. Semantic AI-powered
        ranking is planned for an upcoming milestone.
      </p>

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

          {status !== "error" && (
            <ResultsHeader
              count={results.length}
              sort={query.sort}
              onSortChange={(sort) => setQuery((current) => ({ ...current, sort }))}
            />
          )}

          <div className="mt-5">
            {status === "loading" && <LoadingState />}
            {status === "error" && (
              <ErrorState message={error ?? "Poly Haven is unavailable right now. Please try again shortly."} />
            )}
            {status === "success" && results.length === 0 && <EmptyState />}
            {status === "success" && results.length > 0 && (
              <>
                <AssetGrid
                  assets={results.slice(0, RESULT_RENDER_LIMIT)}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
                {results.length > RESULT_RENDER_LIMIT && (
                  <p className="mt-6 text-center text-xs text-text-faint">
                    Showing the top {RESULT_RENDER_LIMIT} of {results.length} matches — refine your search or
                    filters to narrow further.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
