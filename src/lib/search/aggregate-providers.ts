import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";

export interface ProviderOutcome {
  readonly providerId: string;
  readonly status: "fulfilled" | "rejected";
  readonly error?: string;
}

export interface AggregatedSearchResult {
  readonly results: readonly AssetSearchResult[];
  readonly providerOutcomes: readonly ProviderOutcome[];
}

export const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Provider timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Queries every provider in parallel via Promise.allSettled, each wrapped in
 * its own timeout, so one slow or failing provider (e.g. Sketchfab down or
 * unreachable) never blocks or breaks the others (e.g. Poly Haven). Returns
 * both the combined raw results (unsorted, undeduplicated — callers apply
 * that afterward) and a per-provider outcome list for surfacing a
 * non-blocking "source unavailable" notice in the UI.
 */
export async function searchAllProviders(
  providers: readonly AssetSearchProvider[],
  query: AssetSearchQuery,
  timeoutMs: number = DEFAULT_PROVIDER_TIMEOUT_MS,
): Promise<AggregatedSearchResult> {
  const settled = await Promise.allSettled(providers.map((provider) => withTimeout(provider.search(query), timeoutMs)));

  const results: AssetSearchResult[] = [];
  const providerOutcomes: ProviderOutcome[] = [];

  settled.forEach((outcome, index) => {
    const provider = providers[index];
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
      providerOutcomes.push({ providerId: provider.id, status: "fulfilled" });
    } else {
      providerOutcomes.push({
        providerId: provider.id,
        status: "rejected",
        error: outcome.reason instanceof Error ? outcome.reason.message : "Unknown error",
      });
    }
  });

  return { results, providerOutcomes };
}
