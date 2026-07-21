/**
 * localStorage access guarded for server rendering. Next.js renders on the
 * server first, where `window`/`localStorage` don't exist, so every call
 * checks availability instead of assuming a browser environment.
 */

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing, quota exceeded, etc.).
    // Favoriting is a non-critical enhancement, so we fail silently.
  }
}
