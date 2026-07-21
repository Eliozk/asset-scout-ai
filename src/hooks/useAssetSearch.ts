"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { DEFAULT_QUERY } from "@/domain/asset";
import { polyHavenSearchProvider } from "@/lib/providers/polyhaven/provider";
import { sketchfabSearchProvider } from "@/lib/providers/sketchfab/provider";
import { kenneyCatalogSearchProvider } from "@/lib/providers/kenney/provider";
import { pixabaySearchProvider } from "@/lib/providers/pixabay/provider";
import { fetchCombinedResults } from "@/lib/search/combined-search";
import type { ProviderOutcome } from "@/lib/search/aggregate-providers";

const DEFAULT_PROVIDERS: readonly AssetSearchProvider[] = [
  polyHavenSearchProvider,
  sketchfabSearchProvider,
  kenneyCatalogSearchProvider,
  pixabaySearchProvider,
];

interface SettledResult {
  readonly query: AssetSearchQuery;
  readonly status: "success" | "error";
  readonly results: readonly AssetSearchResult[];
  readonly error: string | null;
  readonly providerOutcomes: readonly ProviderOutcome[];
}

/**
 * Drives asset search across one or more AssetSearchProvider sources,
 * queried in parallel with individual timeouts (see lib/search/aggregate-providers.ts)
 * so one source failing (e.g. Sketchfab down) never breaks another (e.g.
 * Poly Haven). Defaults to the live Poly Haven + Sketchfab providers; pass
 * an explicit provider list for tests/development.
 *
 * `status: "error"` only fires when EVERY provider failed — a partial
 * failure stays "success" with a smaller result set, surfaced instead via
 * `providerOutcomes` for a non-blocking "source unavailable" notice.
 *
 * Status is derived during render by comparing the last *settled* query to
 * the current one, rather than set with a synchronous setState call inside
 * the effect body — that pattern causes an avoidable extra render and is
 * flagged by react-hooks/set-state-in-effect.
 */
export function useAssetSearch(providers: readonly AssetSearchProvider[] = DEFAULT_PROVIDERS) {
  const [query, setQuery] = useState<AssetSearchQuery>(DEFAULT_QUERY);
  const [settled, setSettled] = useState<SettledResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCombinedResults(providers, query)
      .then(({ results, providerOutcomes }) => {
        if (cancelled) return;
        const allFailed = providerOutcomes.length > 0 && providerOutcomes.every((o) => o.status === "rejected");
        if (allFailed) {
          const message = providerOutcomes[0]?.error ?? "Search failed unexpectedly.";
          setSettled({ query, status: "error", results: [], error: message, providerOutcomes });
        } else {
          setSettled({ query, status: "success", results, error: null, providerOutcomes });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Search failed unexpectedly.";
        setSettled({ query, status: "error", results: [], error: message, providerOutcomes: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [providers, query]);

  const isCurrent = settled !== null && settled.query === query;

  return useMemo(
    () => ({
      query,
      setQuery,
      status: isCurrent ? settled.status : ("loading" as const),
      results: isCurrent ? settled.results : [],
      error: isCurrent ? settled.error : null,
      providerOutcomes: isCurrent ? settled.providerOutcomes : [],
    }),
    [query, isCurrent, settled],
  );
}
