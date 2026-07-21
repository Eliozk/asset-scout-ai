import type { AssetLicense, AssetSearchResult, AssetStyle, AssetType, AssetFileFormat } from "@/domain/asset";
import type { SketchfabRawModel } from "./raw-types";

/**
 * Sketchfab's official category slugs -> our AssetType, built from the real
 * list returned by GET /v3/categories against the live API (18 categories
 * total, confirmed 2026-07). Anything unmatched falls back to "Prop" — a
 * safe generic default, never invented specifics.
 */
const CATEGORY_TO_ASSET_TYPE: Readonly<Record<string, AssetType>> = {
  "characters-creatures": "Character",
  people: "Character",
  "animals-pets": "Character",
  "cars-vehicles": "Vehicle",
  "weapons-military": "Weapon",
  "furniture-home": "Prop",
  "electronics-gadgets": "Prop",
  "food-drink": "Prop",
  "fashion-style": "Prop",
  music: "Prop",
  "sports-fitness": "Prop",
  "science-technology": "Prop",
  architecture: "Environment",
  "places-travel": "Environment",
  "nature-plants": "Environment",
  "cultural-heritage-history": "Environment",
};

function inferAssetType(categories: readonly { readonly name: string }[]): AssetType {
  for (const category of categories) {
    const slug = category.name.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-");
    const match = CATEGORY_TO_ASSET_TYPE[slug];
    if (match) return match;
  }
  return "Prop";
}

/** Tag-based style inference — a heuristic read from real provided tags, not a guess about unlabeled models. */
const STYLE_TAG_MAP: Readonly<Record<string, AssetStyle>> = {
  lowpoly: "Low-poly",
  "low-poly": "Low-poly",
  low_poly: "Low-poly",
  stylized: "Stylized",
  pixelart: "Pixel-art",
  "pixel-art": "Pixel-art",
  pixel_art: "Pixel-art",
  handpainted: "Hand-painted",
  "hand-painted": "Hand-painted",
  cartoon: "Cartoon",
  toon: "Cartoon",
  realistic: "Realistic",
  photorealistic: "Realistic",
  photoreal: "Realistic",
  photogrammetry: "Realistic",
  scan: "Realistic",
};

function inferStyle(tags: readonly { readonly name: string }[]): AssetStyle {
  for (const tag of tags) {
    const match = STYLE_TAG_MAP[tag.name.toLowerCase()];
    if (match) return match;
  }
  // Sketchfab hosts everything from stylized game art to photogrammetry scans;
  // "Realistic" is a documented heuristic default, not a claim about this
  // specific model when no style tag is present.
  return "Realistic";
}

function mapLicense(license: SketchfabRawModel["license"]): AssetLicense {
  if (!license) return "Custom";
  const label = license.label.toLowerCase();
  if (label === "cc0" || label.includes("public domain")) return "CC0";
  if (label === "cc attribution") return "CC-BY";
  // Other CC variants (NonCommercial / NoDerivs / ShareAlike combinations) are
  // real, meaningfully more restrictive licenses our enum has no dedicated
  // slot for — "Custom" plus licenseDetail keeps the exact terms visible
  // rather than collapsing them into a falsely-permissive bucket.
  return "Custom";
}

/** Archive keys Sketchfab actually returns that map onto our existing format enum — never invented. */
const ARCHIVE_KEY_TO_FORMAT: Readonly<Record<string, AssetFileFormat>> = {
  gltf: "GLTF",
  glb: "GLB",
  obj: "OBJ",
  fbx: "FBX",
};

function mapFormats(archiveFormats: readonly string[]): readonly AssetFileFormat[] | undefined {
  const mapped = archiveFormats
    .map((key) => ARCHIVE_KEY_TO_FORMAT[key.toLowerCase()])
    .filter((format): format is AssetFileFormat => format !== undefined);
  return mapped.length > 0 ? mapped : undefined;
}

function pickThumbnail(images: SketchfabRawModel["thumbnailImages"]): string {
  // Prefer a mid-size image (~1024px wide) — large enough for a crisp card,
  // small enough not to waste bandwidth loading the full 1920px original.
  const sorted = [...images].sort((a, b) => Math.abs(a.width - 1024) - Math.abs(b.width - 1024));
  return sorted[0].url;
}

function formatPublishedDate(model: SketchfabRawModel): string {
  const raw = model.publishedAt ?? model.createdAt;
  if (!raw) return new Date(0).toISOString().slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

/**
 * Pure mapper from one validated Sketchfab model into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parseSketchfabRawModel. matchScore/whyItFits are neutral, query-independent
 * defaults here; the live provider always recomputes them per-query via
 * lib/search/relevance.ts before returning results to the UI.
 */
export function normalizeSketchfabModel(raw: SketchfabRawModel): AssetSearchResult {
  return {
    id: `sketchfab:${raw.uid}`,
    name: raw.name,
    description: raw.description || `A 3D model from Sketchfab by ${raw.user.displayName}.`,
    source: "sketchfab",
    category: "3D",
    assetType: inferAssetType(raw.categories),
    // Sketchfab's public search response has no price field at all — every
    // result is free to view/embed on Sketchfab; download/commercial terms
    // beyond that are governed by the license we do surface, not a price we
    // don't have and won't invent.
    pricing: { model: "free" },
    license: mapLicense(raw.license),
    licenseDetail: raw.license?.label,
    formats: mapFormats(raw.archiveFormats),
    engines: ["Engine-agnostic"],
    style: inferStyle(raw.tags),
    tags: raw.tags.map((tag) => tag.name.toLowerCase()),
    matchScore: 50,
    whyItFits: "3D model from Sketchfab.",
    externalUrl: raw.viewerUrl,
    addedAt: formatPublishedDate(raw),
    thumbnailUrl: pickThumbnail(raw.thumbnailImages),
    authors: [raw.user.displayName],
    polycount: raw.faceCount,
  };
}
