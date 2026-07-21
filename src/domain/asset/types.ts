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

export const ASSET_SOURCE_IDS = [
  "sketchfab",
  "polyhaven",
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
  readonly category: AssetCategory;
  readonly assetType: AssetType;
  readonly pricing: AssetPricing;
  readonly license: AssetLicense;
  readonly formats: readonly AssetFileFormat[];
  readonly engines: readonly EngineCompatibility[];
  readonly style: AssetStyle;
  /** Lowercase free-text tags used for search matching and quick project chips. */
  readonly tags: readonly string[];
  /** Placeholder AI match score (0-100). Demonstration data only in this milestone. */
  readonly matchScore: number;
  /** Placeholder "why it fits" explanation. Demonstration data only in this milestone. */
  readonly whyItFits: string;
  readonly externalUrl: string;
  readonly addedAt: string;
}
