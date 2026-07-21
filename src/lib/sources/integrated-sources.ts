import type { AssetSourceId } from "@/domain/asset";

export type IntegratedConnectionMode = "live-api" | "authorized-indexed-catalog";

export interface IntegratedSourceInfo {
  /** Matches a real AssetSourceId — these sources' results DO appear in the verified grid. */
  readonly id: AssetSourceId;
  readonly name: string;
  readonly assetTypes: readonly string[];
  readonly connectionMode: IntegratedConnectionMode;
  readonly attributionNote: string;
  readonly limitation: string;
  readonly homepageUrl: string;
}

/** Group A: queried live, per search, through our own server-side proxy routes. */
export const LIVE_API_SOURCES: readonly IntegratedSourceInfo[] = [
  {
    id: "polyhaven",
    name: "Poly Haven",
    assetTypes: ["HDRIs", "textures", "3D models"],
    connectionMode: "live-api",
    attributionNote: "CC0 — public domain. Attribution is appreciated by Poly Haven but not legally required.",
    limitation: "The full catalog is fetched and cached in-memory for ~6h, so a brand-new release can take up to that long to appear.",
    homepageUrl: "https://polyhaven.com",
  },
  {
    id: "sketchfab",
    name: "Sketchfab",
    assetTypes: ["3D models"],
    connectionMode: "live-api",
    attributionNote: "License varies per model and is shown on each result — always credit the individual creator as Sketchfab requires.",
    limitation: "Limited to Sketchfab's own public text search relevance; only publicly searchable models are reachable.",
    homepageUrl: "https://sketchfab.com",
  },
  {
    id: "pixabay",
    name: "Pixabay",
    assetTypes: ["photos", "illustrations", "vector graphics"],
    connectionMode: "live-api",
    attributionNote: "Pixabay Content License (royalty-free) — Pixabay asks that its results be credited whenever shown.",
    limitation: "Images only — Pixabay's public API does not expose its 3D Models, Music, Sound Effects, or GIFs categories.",
    homepageUrl: "https://pixabay.com",
  },
];

/** Group B: a versioned static snapshot, regenerated periodically — never fetched live at search time. */
export const AUTHORIZED_INDEXED_CATALOG_SOURCES: readonly IntegratedSourceInfo[] = [
  {
    id: "kenney",
    name: "Kenney",
    assetTypes: ["2D sprites & UI", "3D low-poly kits", "textures"],
    connectionMode: "authorized-indexed-catalog",
    attributionNote: "CC0 — confirmed directly on Kenney's own asset pages.",
    limitation:
      "A static snapshot of Kenney's official feed — only its ~25 most recent releases at generation time, not the full historical catalog.",
    homepageUrl: "https://kenney.nl",
  },
];
