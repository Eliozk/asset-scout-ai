import { NextRequest, NextResponse } from "next/server";
import type { SearchIntent } from "@/domain/search-intent";
import { fetchSearchIntentFromGemini, isGeminiConfigured, type GeminiUnavailableReason } from "@/lib/gemini/fetch-intent";
import { prepareRawQueryForGemini } from "@/lib/gemini/validate-intent";

/**
 * Server-only Route Handler for Gemini query understanding. The client
 * (useQueryUnderstanding.ts) calls only this route — never the Gemini API
 * directly — so GEMINI_API_KEY never reaches the browser, matching the same
 * "provider called only from its own Route Handler" rule every other
 * provider in this app follows (AGENTS.md).
 *
 * Response shape is always `{ intent: SearchIntent | null, reason?: string }`
 * — `reason` is one of a small closed set of non-sensitive labels (see
 * GeminiUnavailableReason and the two local-only reasons added below), never
 * the raw upstream error body, HTTP response, or anything that could reveal
 * whether/how GEMINI_API_KEY is configured beyond "missing-key".
 */

export type QueryUnderstandReason = GeminiUnavailableReason | "empty-query" | "rate-limited-local";

interface QueryUnderstandResponseBody {
  readonly intent: SearchIntent | null;
  readonly reason?: QueryUnderstandReason;
}

interface CacheEntry {
  readonly intent: SearchIntent;
  readonly expiresAt: number;
}

// Small, bounded, in-memory, per-server-instance only. On Vercel this is NOT
// shared across instances/regions/cold starts — it just avoids redundant
// Gemini calls for identical repeated queries within one warm instance's
// lifetime. Never claim (here or in the UI) that this is a global cache.
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const cache = new Map<string, CacheEntry>();

// Coalesces identical concurrent in-flight requests within one instance so
// two browser tabs (or a fast double-submit) submitting the same text at the
// same moment share one upstream Gemini call instead of two.
const inflight = new Map<string, Promise<{ intent: SearchIntent | null; reason?: GeminiUnavailableReason }>>();

/**
 * Conservative PER-INSTANCE rate limit — a fixed-window counter, reset every
 * WINDOW_MS. This is explicitly NOT a global or abuse-proof limiter: Vercel
 * can run multiple concurrent instances, each with its own independent
 * counter, and a cold start resets it to zero. It exists only to keep one
 * warm instance from burning through Gemini's free-tier quota on its own
 * during a burst, never as a security control.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
let windowStartedAt = Date.now();
let windowRequestCount = 0;

function isLocallyRateLimited(): boolean {
  const now = Date.now();
  if (now - windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    windowStartedAt = now;
    windowRequestCount = 0;
  }
  windowRequestCount += 1;
  return windowRequestCount > RATE_LIMIT_MAX_REQUESTS;
}

function cacheKey(cleanedQuery: string): string {
  return cleanedQuery.toLowerCase();
}

function readCache(key: string): SearchIntent | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.intent;
}

function writeCache(key: string, intent: SearchIntent): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { intent, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<QueryUnderstandResponseBody>({ intent: null, reason: "internal-error" }, { status: 400 });
  }

  const rawQuery = typeof (body as { query?: unknown } | null)?.query === "string" ? (body as { query: string }).query : "";
  const cleanedQuery = prepareRawQueryForGemini(rawQuery);

  if (!cleanedQuery) {
    return NextResponse.json<QueryUnderstandResponseBody>({ intent: null, reason: "empty-query" });
  }

  if (!isGeminiConfigured()) {
    // No key configured: never even attempt an SDK/network call.
    return NextResponse.json<QueryUnderstandResponseBody>({ intent: null, reason: "missing-key" });
  }

  if (isLocallyRateLimited()) {
    return NextResponse.json<QueryUnderstandResponseBody>({ intent: null, reason: "rate-limited-local" });
  }

  const key = cacheKey(cleanedQuery);

  const cached = readCache(key);
  if (cached) {
    return NextResponse.json<QueryUnderstandResponseBody>({ intent: cached });
  }

  const existingInflight = inflight.get(key);
  if (existingInflight) {
    const result = await existingInflight;
    return NextResponse.json<QueryUnderstandResponseBody>(
      result.intent ? { intent: result.intent } : { intent: null, reason: result.reason },
    );
  }

  const promise = fetchSearchIntentFromGemini(cleanedQuery).then((result) => {
    if (result.ok) {
      writeCache(key, result.intent);
      return { intent: result.intent as SearchIntent | null };
    }
    return { intent: null, reason: result.reason };
  });

  inflight.set(key, promise);
  try {
    const result = await promise;
    return NextResponse.json<QueryUnderstandResponseBody>(
      result.intent ? { intent: result.intent } : { intent: null, reason: result.reason },
    );
  } finally {
    inflight.delete(key);
  }
}
