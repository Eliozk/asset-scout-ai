import type { AssetSearchProvider, AssetSearchQuery, AssetSearchResult } from "@/domain/asset";

export interface ProviderOutcome {
  readonly providerId: string;
  /** "pending" only ever appears in a progressive snapshot taken before that provider settled. */
  readonly status: "fulfilled" | "rejected" | "pending";
  readonly error?: string;
}

export interface AggregatedSearchResult {
  readonly results: readonly AssetSearchResult[];
  readonly providerOutcomes: readonly ProviderOutcome[];
}

export const DEFAULT_PROVIDER_TIMEOUT_MS = 8_000;

/**
 * How long the remaining providers get after the first one succeeds before a
 * partial snapshot is shown. Healthy live sources answer in ~0.6–1.5s, and
 * anything that lands later is still merged in, so a short window costs nothing.
 */
export const DEFAULT_STRAGGLER_GRACE_MS = 2_000;

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

export interface ProgressiveSearchOptions {
  readonly timeoutMs?: number;
  readonly graceMs?: number;
}

/**
 * Same parallel, per-provider-timeout search as searchAllProviders, but one
 * slow source can never hold the whole page: once the first provider
 * succeeds, the rest get `graceMs` before a partial snapshot is emitted
 * (still-running providers marked "pending"). Every later arrival emits an
 * updated snapshot, so a source that is merely slow still lands; `isFinal` is
 * true on the snapshot taken once every provider has settled or timed out.
 *
 * Returns a cancel function — after it's called, no further snapshots fire.
 */
export function searchProvidersProgressively(
  providers: readonly AssetSearchProvider[],
  query: AssetSearchQuery,
  onSnapshot: (snapshot: AggregatedSearchResult, isFinal: boolean) => void,
  { timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS, graceMs = DEFAULT_STRAGGLER_GRACE_MS }: ProgressiveSearchOptions = {},
): () => void {
  const settled: (PromiseSettledResult<readonly AssetSearchResult[]> | undefined)[] = providers.map(() => undefined);
  let remaining = providers.length;
  let cancelled = false;
  let graceTimer: ReturnType<typeof setTimeout> | undefined;
  let partialShown = false;

  const emit = (isFinal: boolean) => {
    if (cancelled) return;
    const results: AssetSearchResult[] = [];
    const providerOutcomes = providers.map((provider, index): ProviderOutcome => {
      const outcome = settled[index];
      if (!outcome) return { providerId: provider.id, status: "pending" };
      if (outcome.status === "fulfilled") {
        results.push(...outcome.value);
        return { providerId: provider.id, status: "fulfilled" };
      }
      return {
        providerId: provider.id,
        status: "rejected",
        error: outcome.reason instanceof Error ? outcome.reason.message : "Unknown error",
      };
    });
    onSnapshot({ results, providerOutcomes }, isFinal);
  };

  if (providers.length === 0) {
    queueMicrotask(() => emit(true));
  }

  providers.forEach((provider, index) => {
    withTimeout(provider.search(query), timeoutMs)
      .then(
        (value): PromiseSettledResult<readonly AssetSearchResult[]> => ({ status: "fulfilled", value }),
        (reason: unknown): PromiseSettledResult<readonly AssetSearchResult[]> => ({ status: "rejected", reason }),
      )
      .then((outcome) => {
        settled[index] = outcome;
        remaining -= 1;

        if (remaining === 0) {
          clearTimeout(graceTimer);
          emit(true);
        } else if (partialShown) {
          emit(false);
        } else if (outcome.status === "fulfilled" && graceTimer === undefined) {
          graceTimer = setTimeout(() => {
            partialShown = true;
            emit(false);
          }, graceMs);
        }
      });
  });

  return () => {
    cancelled = true;
    clearTimeout(graceTimer);
  };
}
