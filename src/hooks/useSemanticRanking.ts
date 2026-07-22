"use client";

import { useEffect, useRef, useState } from "react";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { getSemanticRuntime, type SemanticRuntime } from "@/lib/semantic/browser-runtime";
import { rankBySemanticSimilarity } from "@/lib/semantic/ranking";
import { polyHavenSearchProvider } from "@/lib/providers/polyhaven/provider";
import { sketchfabSearchProvider } from "@/lib/providers/sketchfab/provider";
import { kenneyCatalogSearchProvider } from "@/lib/providers/kenney/provider";
import { pixabaySearchProvider } from "@/lib/providers/pixabay/provider";
import { fetchCombinedResults } from "@/lib/search/combined-search";
import { deduplicateAssets } from "@/lib/search/deduplicate";

export type SemanticStatus = "loading" | "ready" | "unavailable";

const DEFAULT_PROVIDERS: readonly AssetSearchProvider[] = [
  polyHavenSearchProvider,
  sketchfabSearchProvider,
  kenneyCatalogSearchProvider,
  pixabaySearchProvider,
];

interface SemanticOutput {
  readonly ranked: readonly AssetSearchResult[];
  readonly scoresById: ReadonlyMap<string, number>;
}

const EMPTY_SCORES: ReadonlyMap<string, number> = new Map();

interface Settled {
  readonly query: AssetSearchQuery;
  readonly output: SemanticOutput;
}

/**
 * Loads the local semantic search model + precomputed embeddings lazily in
 * the background — it never blocks initial results, which are already
 * rendered via deterministic keyword ranking (see useAssetSearch). Once
 * ready, it re-ranks by cosine similarity to the current query text.
 *
 * Important: the deterministic keyword filter requires EVERY search word to
 * literally appear on an asset (an AND match), which is the right behavior
 * for short deliberate queries but routinely zeroes out full natural-
 * language sentences before semantic search would ever get a candidate to
 * rank. So when semantic ranking is active, it ALSO fetches a broader
 * candidate pool across ALL providers (same parallel/timeout/dedup pipeline
 * as useAssetSearch) with the search text cleared — all OTHER filters
 * (category, price, license, etc.) still apply.
 *
 * That broadened, text-cleared fetch is NOT used by itself, though (Milestone
 * 6 "car kit" investigation): Sketchfab and Pixabay only support real
 * server-side search and deliberately return zero results for blank text
 * (see their provider.ts files), so a candidate pool built from blank text
 * ALONE would silently exclude them completely, however strong a real match
 * they have for the actual query. The broadened pool is therefore MERGED
 * with `deterministicResults` (the real-text results already fetched by
 * useAssetSearch) before ranking — so a genuine Sketchfab/Pixabay/Kenney
 * match for the real query text is always a ranking candidate, never
 * silently dropped just because it doesn't have a precomputed embedding.
 *
 * Only assets with a precomputed embedding get a semantic score — anything
 * else (e.g. a Sketchfab or Kenney result the embeddings artifact doesn't
 * cover yet) keeps its own deterministic keyword-relevance score and
 * competes directly against semantic scores on that same 0-100 scale (see
 * rankBySemanticSimilarity) — a strong literal match can outrank a weak
 * semantic guess instead of always losing to it. It's also never labeled
 * "AI Match" by the UI, which only reads scoresById.
 *
 * Only ever active for the "best-match" sort and a non-empty query — an
 * explicit price/name sort, or no search text at all, is left entirely to
 * the deterministic pipeline, which is returned unchanged.
 */
export function useSemanticRanking(
  query: AssetSearchQuery,
  deterministicResults: readonly AssetSearchResult[],
  providers: readonly AssetSearchProvider[] = DEFAULT_PROVIDERS,
): { status: SemanticStatus; ranked: readonly AssetSearchResult[]; scoresById: ReadonlyMap<string, number> } {
  const [status, setStatus] = useState<SemanticStatus>("loading");
  const runtimeRef = useRef<SemanticRuntime | null>(null);
  const [settled, setSettled] = useState<Settled | null>(null);

  // Load the model + embeddings once per page session.
  useEffect(() => {
    let cancelled = false;
    getSemanticRuntime()
      .then((runtime) => {
        if (cancelled) return;
        runtimeRef.current = runtime;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canRank = status === "ready" && query.sort === "best-match" && query.text.trim() !== "";

  // Re-rank whenever the query changes.
  useEffect(() => {
    if (!canRank) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    let cancelled = false;
    const candidatePoolQuery: AssetSearchQuery = { ...query, text: "" };

    Promise.all([fetchCombinedResults(providers, candidatePoolQuery), runtime.embedQuery(query.text)])
      .then(([{ results: broadenedPool }, queryEmbedding]) => {
        if (cancelled) return;
        // Real-text matches first, so deduplicateAssets (keep-first) prefers
        // their genuine keyword-relevance score over a same-asset entry that
        // only appears in the blank-text broadened pool.
        const candidatePool = deduplicateAssets([...deterministicResults, ...broadenedPool]);
        const result = rankBySemanticSimilarity(candidatePool, queryEmbedding, runtime.embeddingsById);
        setSettled({ query, output: { ranked: result.ranked, scoresById: result.scoresById } });
      })
      .catch(() => {
        // A single failed rank attempt doesn't flip the whole model to
        // "unavailable" — this query just falls back to the deterministic
        // order below.
      });
    return () => {
      cancelled = true;
    };
  }, [canRank, query, providers, deterministicResults]);

  const isCurrent = settled !== null && settled.query === query;

  if (canRank && isCurrent) {
    return { status, ranked: settled.output.ranked, scoresById: settled.output.scoresById };
  }
  return { status, ranked: deterministicResults, scoresById: EMPTY_SCORES };
}
