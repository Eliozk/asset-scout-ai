"use client";

import { useEffect, useState } from "react";
import type { AssetSearchResult } from "@/domain/asset";
import { fetchSketchfabAssetById } from "@/lib/providers/sketchfab/provider";

const SKETCHFAB_PREFIX = "sketchfab:";

interface Settled {
  readonly key: string;
  readonly assets: readonly AssetSearchResult[];
}

/**
 * Resolves favorited Sketchfab assets missing from `foundResults`.
 *
 * Poly Haven favorites always survive an empty-text search (the provider
 * treats that as "whole catalog"), but Sketchfab has no such bulk endpoint —
 * an empty-text Sketchfab search intentionally returns nothing (see
 * sketchfabSearchProvider). So a favorited Sketchfab asset that isn't in the
 * current result set is looked up directly by id instead of being silently
 * dropped from the Favorites page.
 */
export function useMissingSketchfabFavorites(
  favoriteIds: readonly string[],
  foundResults: readonly AssetSearchResult[],
): readonly AssetSearchResult[] {
  const [settled, setSettled] = useState<Settled | null>(null);

  const missingUids = favoriteIds
    .filter((id) => id.startsWith(SKETCHFAB_PREFIX) && !foundResults.some((asset) => asset.id === id))
    .map((id) => id.slice(SKETCHFAB_PREFIX.length))
    .sort();
  const key = missingUids.join(",");

  useEffect(() => {
    if (key === "") return;
    let cancelled = false;
    const uids = key.split(",");

    Promise.all(uids.map((uid) => fetchSketchfabAssetById(uid))).then((resolved) => {
      if (cancelled) return;
      const assets = resolved.filter((asset): asset is AssetSearchResult => asset !== null);
      setSettled({ key, assets });
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return settled !== null && settled.key === key ? settled.assets : [];
}
