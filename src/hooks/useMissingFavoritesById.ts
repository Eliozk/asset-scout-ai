"use client";

import { useEffect, useState } from "react";
import type { AssetSearchResult } from "@/domain/asset";

interface Settled {
  readonly key: string;
  readonly assets: readonly AssetSearchResult[];
}

/**
 * Generic support for resolving a favorited asset that a provider's regular
 * search can't recover on its own — Sketchfab and Pixabay both have no
 * "browse everything" endpoint (unlike Poly Haven/Kenney, where an
 * empty-text search returns the whole catalog), so a favorited item missing
 * from the current result set is looked up directly by id via a documented
 * per-id endpoint instead of being silently dropped from the Favorites page.
 *
 * `fetchById` must be a stable module-level function reference (not an
 * inline arrow) — it's an effect dependency, and a new reference every
 * render would re-run the lookup unnecessarily on every render.
 */
export function useMissingFavoritesById(
  prefix: string,
  fetchById: (id: string) => Promise<AssetSearchResult | null>,
  favoriteIds: readonly string[],
  foundResults: readonly AssetSearchResult[],
): readonly AssetSearchResult[] {
  const [settled, setSettled] = useState<Settled | null>(null);

  const missingIds = favoriteIds
    .filter((id) => id.startsWith(prefix) && !foundResults.some((asset) => asset.id === id))
    .map((id) => id.slice(prefix.length))
    .sort();
  const key = missingIds.join(",");

  useEffect(() => {
    if (key === "") return;
    let cancelled = false;
    const ids = key.split(",");

    Promise.all(ids.map((id) => fetchById(id))).then((resolved) => {
      if (cancelled) return;
      const assets = resolved.filter((asset): asset is AssetSearchResult => asset !== null);
      setSettled({ key, assets });
    });

    return () => {
      cancelled = true;
    };
  }, [key, fetchById]);

  return settled !== null && settled.key === key ? settled.assets : [];
}
