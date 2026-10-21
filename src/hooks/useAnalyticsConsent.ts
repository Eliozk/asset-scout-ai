"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readJson, writeJson } from "@/lib/storage";

export const ANALYTICS_CONSENT_STORAGE_KEY = "asset-scout-ai:analytics-consent";

/**
 * "unset" means the visitor hasn't chosen yet (show the banner). "pending" is
 * the server render and the first client render, before localStorage can be
 * read — nothing consent-dependent renders then, so the banner never flashes
 * for visitors who already chose.
 */
export type AnalyticsConsent = "granted" | "denied" | "unset" | "pending";

type Listener = () => void;
const listeners = new Set<Listener>();

// Snapshots are string literals, so they're referentially stable as-is —
// no caching needed (unlike useFavorites' parsed array).
function getSnapshot(): AnalyticsConsent {
  const stored = readJson<unknown>(ANALYTICS_CONSENT_STORAGE_KEY, null);
  return stored === "granted" || stored === "denied" ? stored : "unset";
}

function getServerSnapshot(): AnalyticsConsent {
  return "pending";
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: "granted" | "denied" | null): void {
  writeJson(ANALYTICS_CONSENT_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

/** The visitor's analytics-cookie choice, shared by the banner, the loader, and the footer link. */
export function useAnalyticsConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => persist("granted"), []);
  const decline = useCallback(() => persist("denied"), []);
  /** Forgets the choice so the banner asks again. */
  const reset = useCallback(() => persist(null), []);

  return { consent, accept, decline, reset };
}
