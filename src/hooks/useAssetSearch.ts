"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { polyHavenSearchProvider } from "@/lib/providers/polyhaven/provider";

interface SettledResult {
  readonly query: AssetSearchQuery;
  readonly status: "success" | "error";
  readonly results: readonly AssetSearchResult[];
  readonly error: string | null;
}

/**
 * Drives asset search through the AssetSearchProvider contract. Defaults to
 * the live Poly Haven provider; pass mockAssetSearchProvider explicitly for
 * tests/development against the offline demo dataset.
 *
 * Status is derived during render by comparing the last *settled* query to
 * the current one, rather than set with a synchronous setState call inside
 * the effect body — that pattern causes an avoidable extra render and is
 * flagged by react-hooks/set-state-in-effect.
 */
export function useAssetSearch(provider: AssetSearchProvider = polyHavenSearchProvider) {
  const [query, setQuery] = useState<AssetSearchQuery>(DEFAULT_QUERY);
  const [settled, setSettled] = useState<SettledResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    provider
      .search(query)
      .then((results) => {
        if (cancelled) return;
        setSettled({ query, status: "success", results, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Search failed unexpectedly.";
        setSettled({ query, status: "error", results: [], error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [provider, query]);

  const isCurrent = settled !== null && settled.query === query;

  return useMemo(
    () => ({
      query,
      setQuery,
      status: isCurrent ? settled.status : ("loading" as const),
      results: isCurrent ? settled.results : [],
      error: isCurrent ? settled.error : null,
    }),
    [query, isCurrent, settled],
  );
}
