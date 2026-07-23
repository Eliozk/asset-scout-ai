"use client";

import { useCallback, useRef, useState } from "react";
import type { SearchIntent } from "@/domain/search-intent";

export type QueryUnderstandingStatus =
  | "idle"
  | "understanding"
  | "understood"
  | "unavailable"
  | "cooldown";

interface QueryUnderstandingState {
  readonly status: QueryUnderstandingStatus;
  readonly intent: SearchIntent | null;
}

interface ApiResponseBody {
  readonly intent: SearchIntent | null;
  readonly reason?: string;
}

/** Client-side submission cooldown — a lightweight, honest "don't hammer the button" guard, not a security control. */
const SUBMIT_COOLDOWN_MS = 1_500;

/**
 * Drives Gemini query understanding for exactly one explicitly-submitted
 * search at a time. Deliberately NOT tied to every keystroke — the existing
 * live-as-you-type local/provider search (useAssetSearch) is untouched and
 * keeps working exactly as before; this hook only ever fires on `submit()`,
 * satisfying "maximum one Gemini request per explicitly submitted search."
 *
 * A new submit() call aborts any still-in-flight previous request (so a
 * user submitting twice quickly never races two stale responses against
 * each other), and a short client-side cooldown prevents rapid repeat
 * submissions from spamming the route.
 */
export function useQueryUnderstanding() {
  const [state, setState] = useState<QueryUnderstandingState>({ status: "idle", intent: null });
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSubmitAtRef = useRef(0);

  const submit = useCallback(async (rawText: string): Promise<SearchIntent | null> => {
    const trimmed = rawText.trim();
    if (trimmed === "") {
      setState({ status: "idle", intent: null });
      return null;
    }

    const now = Date.now();
    if (now - lastSubmitAtRef.current < SUBMIT_COOLDOWN_MS) {
      setState((current) => ({ status: "cooldown", intent: current.intent }));
      return null;
    }
    lastSubmitAtRef.current = now;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ status: "understanding", intent: null });

    try {
      const response = await fetch("/api/query-understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return null;

      if (!response.ok) {
        setState({ status: "unavailable", intent: null });
        return null;
      }

      const body = (await response.json()) as ApiResponseBody;
      if (controller.signal.aborted) return null;

      if (body.intent) {
        setState({ status: "understood", intent: body.intent });
        return body.intent;
      }

      setState({ status: "unavailable", intent: null });
      return null;
    } catch {
      if (controller.signal.aborted) return null;
      setState({ status: "unavailable", intent: null });
      return null;
    }
  }, []);

  return { status: state.status, intent: state.intent, submit };
}
