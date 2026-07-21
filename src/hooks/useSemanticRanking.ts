"use client";

import { useEffect, useRef, useState } from "react";
import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { getSemanticRuntime, type SemanticRuntime } from "@/lib/semantic/browser-runtime";
import { rankBySemanticSimilarity } from "@/lib/semantic/ranking";
import { polyHavenSearchProvider } from "@/lib/providers/polyhaven/provider";

export type SemanticStatus = "loading" | "ready" | "unavailable";

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
 * rank. So when semantic ranking is active, it fetches its own candidate
 * pool via the same provider with the search text cleared (all OTHER
 * filters — category, price, license, etc. — still apply); this is a cache
 * hit against the already-loaded catalog, not a new network request.
 *
 * Only ever active for the "best-match" sort and a non-empty query — an
 * explicit price/name sort, or no search text at all, is left entirely to
 * the deterministic pipeline, which is returned unchanged.
 */
export function useSemanticRanking(
  query: AssetSearchQuery,
  deterministicResults: readonly AssetSearchResult[],
  provider: AssetSearchProvider = polyHavenSearchProvider,
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

    Promise.all([provider.search(candidatePoolQuery), runtime.embedQuery(query.text)])
      .then(([candidatePool, queryEmbedding]) => {
        if (cancelled) return;
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
  }, [canRank, query, provider]);

  const isCurrent = settled !== null && settled.query === query;

  if (canRank && isCurrent) {
    return { status, ranked: settled.output.ranked, scoresById: settled.output.scoresById };
  }
  return { status, ranked: deterministicResults, scoresById: EMPTY_SCORES };
}
