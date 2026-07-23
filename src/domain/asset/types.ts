/**
 * Normalized domain model for a game asset search result.
 *
 * Every supported source (Sketchfab, Poly Haven, Fab, itch.io, Unity Asset
 * Store, OpenGameArt, ...) has its own shape for listings. This module is the
 * single normalized shape the rest of the app is allowed to depend on, so
 * provider-specific quirks never leak into UI components.
 */

export const ASSET_CATEGORIES = ["2D", "3D"] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

/**
 * An asset's actual dimensionality. Distinct from AssetCategory (the query's
 * 2D/3D/All selector): some assets — e.g. a Poly Haven texture, which is a
 * flat image usable on both a 2D sprite and a 3D material — legitimately fit
 * both filters at once, which "both" represents.
 */
export const ASSET_DIMENSIONS = ["2D", "3D", "both"] as const;
export type AssetDimension = (typeof ASSET_DIMENSIONS)[number];

export const ASSET_SOURCE_IDS = [
  "sketchfab",
  "polyhaven",
  "kenney",
  "pixabay",
  "ambientcg",
  "wikimedia",
  "nasa",
  "openverse",
  "fab",
  "itchio",
  "unity-asset-store",
  "opengameart",
] as const;
export type AssetSourceId = (typeof ASSET_SOURCE_IDS)[number];

export interface AssetSource {
  readonly id: AssetSourceId;
  readonly label: string;
  readonly homepageUrl: string;
}

export const ASSET_SOURCES: Readonly<Record<AssetSourceId, AssetSource>> = {
  sketchfab: {
    id: "sketchfab",
    label: "Sketchfab",
    homepageUrl: "https://sketchfab.com",
  },
  polyhaven: {
    id: "polyhaven",
    label: "Poly Haven",
    homepageUrl: "https://polyhaven.com",
  },
  kenney: {
    id: "kenney",
    label: "Kenney",
    homepageUrl: "https://kenney.nl",
  },
  pixabay: {
    id: "pixabay",
    label: "Pixabay",
    homepageUrl: "https://pixabay.com",
  },
  ambientcg: {
    id: "ambientcg",
    label: "ambientCG",
    homepageUrl: "https://ambientcg.com",
  },
  wikimedia: {
    id: "wikimedia",
    label: "Wikimedia Commons",
    homepageUrl: "https://commons.wikimedia.org",
  },
  nasa: {
    id: "nasa",
    label: "NASA Image Library",
    homepageUrl: "https://images.nasa.gov",
  },
  openverse: {
    id: "openverse",
    label: "Openverse",
    homepageUrl: "https://openverse.org",
  },
  fab: {
    id: "fab",
    label: "Fab",
    homepageUrl: "https://www.fab.com",
  },
  itchio: {
    id: "itchio",
    label: "itch.io",
    homepageUrl: "https://itch.io",
  },
  "unity-asset-store": {
    id: "unity-asset-store",
    label: "Unity Asset Store",
    homepageUrl: "https://assetstore.unity.com",
  },
  opengameart: {
    id: "opengameart",
    label: "OpenGameArt",
    homepageUrl: "https://opengameart.org",
  },
};

export const ASSET_TYPES = [
  "Character",
  "Environment",
  "Prop",
  "Weapon",
  "Vehicle",
  "VFX",
  "UI",
  "Material",
  "Animation",
  "HDRI",
  "Texture",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_LICENSES = [
  "CC0",
  "CC-BY",
  "Royalty-Free",
  "Proprietary",
  "Custom",
] as const;
export type AssetLicense = (typeof ASSET_LICENSES)[number];

export const ASSET_FILE_FORMATS = [
  "FBX",
  "OBJ",
  "GLTF",
  "GLB",
  "PNG",
  "SVG",
  "Blend",
  "UnityPackage",
  "Aseprite",
] as const;
export type AssetFileFormat = (typeof ASSET_FILE_FORMATS)[number];

export const ENGINE_COMPATIBILITIES = [
  "Unity",
  "Unreal",
  "Godot",
  "Engine-agnostic",
] as const;
export type EngineCompatibility = (typeof ENGINE_COMPATIBILITIES)[number];

export const ASSET_STYLES = [
  "Realistic",
  "Low-poly",
  "Stylized",
  "Pixel-art",
  "Hand-painted",
  "Cartoon",
] as const;
export type AssetStyle = (typeof ASSET_STYLES)[number];

export type AssetPricing =
  | { readonly model: "free" }
  | { readonly model: "paid"; readonly amount: number; readonly currency: "USD" };

export interface AssetSearchResult {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly source: AssetSourceId;
  readonly category: AssetDimension;
  readonly assetType: AssetType;
  readonly pricing: AssetPricing;
  readonly license: AssetLicense;
  /**
   * The source's own exact license label, when it's more specific than our
   * enum captures (e.g. Sketchfab's "CC Attribution-NonCommercial-NoDerivs").
   * Never invented — only ever the literal string the source returned.
   */
  readonly licenseDetail?: string;
  /** Omitted when the source doesn't tell us exact file formats (e.g. we don't
   *  fetch per-asset file listings from Poly Haven for every search result). */
  readonly formats?: readonly AssetFileFormat[];
  readonly engines: readonly EngineCompatibility[];
  readonly style: AssetStyle;
  /** Lowercase free-text tags used for search matching and quick project chips. */
  readonly tags: readonly string[];
  /**
   * 0-100 relevance/match indicator. For the mock dataset this is
   * hand-authored demo content; for live providers it's a deterministic
   * relevance score computed from the query (see lib/search/relevance.ts) —
   * never a real AI judgment.
   */
  readonly matchScore: number;
  /** Deterministic "why it fits" explanation — not AI-generated analysis. */
  readonly whyItFits: string;
  readonly externalUrl: string;
  readonly addedAt: string;
  /** Real preview image URL, when the source provides one. */
  readonly thumbnailUrl?: string;
  /** The following are only ever populated when the source actually provides them. */
  readonly authors?: readonly string[];
  readonly downloadCount?: number;
  /** Pixel resolution as a human string, e.g. "8192×8192". */
  readonly resolution?: string;
  /** Physical size in millimeters: [width, height] for a texture, [width, height, depth] for a model. */
  readonly dimensionsMm?: readonly number[];
  readonly polycount?: number;
  readonly hasLods?: boolean;
}
