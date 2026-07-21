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

      <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start">
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

          <ResultsHeader
            count={results.length}
            sort={query.sort}
            onSortChange={(sort) => setQuery((current) => ({ ...current, sort }))}
          />

          <div className="mt-5">
            {status === "loading" && <LoadingState />}
            {status === "error" && error !== null && <ErrorState message={error} />}
            {status === "success" && results.length === 0 && <EmptyState />}
            {status === "success" && results.length > 0 && (
              <AssetGrid assets={results} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
