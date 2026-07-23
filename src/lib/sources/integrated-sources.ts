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
  {
    id: "ambientcg",
    name: "ambientCG",
    assetTypes: ["PBR materials", "HDRIs"],
    connectionMode: "live-api",
    attributionNote: "CC0 — public domain, confirmed on ambientCG's own license page. Attribution is appreciated but not legally required.",
    limitation:
      "Only Material and HDRI results are shown — ambientCG's other asset kinds (Decal, Atlas, Substance, Terrain, Brush, PlainTexture) aren't mapped to a normalized asset type yet. No published numeric rate limit; queried conservatively.",
    homepageUrl: "https://ambientcg.com",
  },
  {
    id: "wikimedia",
    name: "Wikimedia Commons",
    assetTypes: ["photos", "scans", "illustrations"],
    connectionMode: "live-api",
    attributionNote:
      "License varies per file and is shown on each result (CC0, CC BY, or other — never guessed). Files with no usable license metadata are labeled unknown/unverified, never assumed free.",
    limitation:
      "General reference images, not verified game-ready asset packs — shown as flat 2D texture/reference material. Results are restricted to actual image files (bitmap/drawing), never audio, video, or category pages.",
    homepageUrl: "https://commons.wikimedia.org",
  },
  {
    id: "nasa",
    name: "NASA Image Library",
    assetTypes: ["space & science photography"],
    connectionMode: "live-api",
    attributionNote:
      "Generally not copyrighted in the US per NASA's own media guidelines — not a Creative Commons grant. A small number of items carry third-party copyright; verify on the details page. Never use the NASA insignia/logo to imply endorsement.",
    limitation: "Restricted to media_type=image only — NASA's library also hosts audio/video, not shown here.",
    homepageUrl: "https://images.nasa.gov",
  },
  {
    id: "openverse",
    name: "Openverse",
    assetTypes: ["openly-licensed images"],
    connectionMode: "live-api",
    attributionNote:
      "License varies per result and is shown on each card, using Openverse's own attribution text. Made with Openverse — AssetScout is not endorsed or certified by Openverse.",
    limitation: "Queried anonymously (no registered client) — a lower rate-limit tier than a registered Openverse API client; mature-flagged content is always excluded.",
    homepageUrl: "https://openverse.org",
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
