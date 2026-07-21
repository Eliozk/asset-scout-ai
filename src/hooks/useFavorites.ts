"use client";

import { useCallback, useSyncExternalStore } from "react";
import { writeJson } from "@/lib/storage";

const FAVORITES_STORAGE_KEY = "asset-scout-ai:favorites";
const EMPTY_FAVORITES: readonly string[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

// useSyncExternalStore requires getSnapshot to return a referentially stable
// value when nothing changed — otherwise React sees a "new" value on every
// check and re-renders forever. We cache the parsed array against the raw
// string last read, so JSON.parse only runs (and only produces a new
// reference) when the stored value actually changes.
let cachedRaw: string | null = null;
let cachedSnapshot: readonly string[] = EMPTY_FAVORITES;

function getSnapshot(): readonly string[] {
  if (typeof window === "undefined") return EMPTY_FAVORITES;

  const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  try {
    cachedSnapshot = raw === null ? EMPTY_FAVORITES : (JSON.parse(raw) as readonly string[]);
  } catch {
    cachedSnapshot = EMPTY_FAVORITES;
  }
  return cachedSnapshot;
}

/** Server render (and pre-hydration client render) always has no favorites. */
function getServerSnapshot(): readonly string[] {
  return EMPTY_FAVORITES;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: readonly string[]): void {
  writeJson(FAVORITES_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

/**
 * Favorite asset ids backed by localStorage. Built on useSyncExternalStore
 * (not useEffect + setState) so the server snapshot and first client render
 * agree — no manual hydration bookkeeping, no hydration mismatch.
 */
export function useFavorites() {
  const favoriteIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleFavorite = useCallback((assetId: string) => {
    const current = getSnapshot();
    const next = current.includes(assetId)
      ? current.filter((id) => id !== assetId)
      : [...current, assetId];
    persist(next);
  }, []);

  const isFavorite = useCallback((assetId: string) => favoriteIds.includes(assetId), [favoriteIds]);

  return { favoriteIds, isFavorite, toggleFavorite };
}
