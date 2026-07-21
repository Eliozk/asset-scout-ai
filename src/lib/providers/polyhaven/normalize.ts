import type { AssetSearchResult, AssetType } from "@/domain/asset";
import { POLY_HAVEN_TYPE_HDRI, POLY_HAVEN_TYPE_TEXTURE, type PolyHavenRawAsset } from "./raw-types";

/**
 * Poly Haven model categories -> our AssetType, built from the categories
 * actually observed via GET /categories/models against the live API.
 * Anything not covered here falls back to "Prop" (a safe generic default for
 * a standalone 3D object), per Milestone 2's requirement to infer type from
 * category/tags without inventing specifics the API doesn't provide.
 */
const MODEL_CATEGORY_TO_ASSET_TYPE: Readonly<Record<string, AssetType>> = {
  weapons: "Weapon",
  firearms: "Weapon",
  creature: "Character",
  ships: "Vehicle",
  nature: "Environment",
  plants: "Environment",
  trees: "Environment",
  rocks: "Environment",
  "ground cover": "Environment",
  grass: "Environment",
  flowers: "Environment",
  "potted plants": "Environment",
  structures: "Environment",
  buildings: "Environment",
  succulent: "Environment",
  furniture: "Prop",
  seating: "Prop",
  table: "Prop",
  shelves: "Prop",
  dishes: "Prop",
  vases: "Prop",
  office: "Prop",
  bed: "Prop",
  decorative: "Prop",
  containers: "Prop",
  tools: "Prop",
  electronics: "Prop",
  appliances: "Prop",
  instrument: "Prop",
  "wall decoration": "Prop",
  food: "Prop",
  props: "Prop",
  industrial: "Prop",
};

function inferModelAssetType(categories: readonly string[]): AssetType {
  for (const category of categories) {
    const match = MODEL_CATEGORY_TO_ASSET_TYPE[category.toLowerCase()];
    if (match) return match;
  }
  return "Prop";
}

function formatResolution(maxResolution: readonly number[] | undefined): string | undefined {
  if (!maxResolution || maxResolution.length < 2) return undefined;
  return `${maxResolution[0]}×${maxResolution[1]}`;
}

function formatPublishedDate(datePublished: number | undefined): string {
  if (datePublished === undefined) return new Date(0).toISOString().slice(0, 10);
  return new Date(datePublished * 1000).toISOString().slice(0, 10);
}

/**
 * Pure mapper from one validated Poly Haven asset into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parsePolyHavenRawAsset. matchScore/whyItFits are set to neutral,
 * query-independent defaults here; the live provider always recomputes them
 * per-query via lib/search/relevance.ts before returning results to the UI.
 */
export function normalizePolyHavenAsset(slug: string, raw: PolyHavenRawAsset): AssetSearchResult {
  const authors = Object.keys(raw.authors);

  const base = {
    id: `polyhaven:${slug}`,
    name: raw.name,
    description: raw.description || `A CC0 ${raw.name} asset from Poly Haven.`,
    source: "polyhaven" as const,
    pricing: { model: "free" as const },
    license: "CC0" as const,
    engines: ["Engine-agnostic" as const],
    style: "Realistic" as const,
    tags: raw.tags.map((tag) => tag.toLowerCase()),
    matchScore: 50,
    whyItFits: "Free CC0 asset from Poly Haven.",
    externalUrl: `https://polyhaven.com/a/${slug}`,
    addedAt: formatPublishedDate(raw.date_published),
    thumbnailUrl: raw.thumbnail_url,
    authors: authors.length > 0 ? authors : undefined,
    downloadCount: raw.download_count,
    resolution: formatResolution(raw.max_resolution),
  };

  if (raw.type === POLY_HAVEN_TYPE_HDRI) {
    return {
      ...base,
      category: "3D",
      assetType: "HDRI",
    };
  }

  if (raw.type === POLY_HAVEN_TYPE_TEXTURE) {
    return {
      ...base,
      category: "both",
      assetType: "Texture",
      dimensionsMm: raw.dimensions,
    };
  }

  // raw.type is narrowed to POLY_HAVEN_TYPE_MODEL here — it's the only value raw-types.ts allows through besides HDRI/Texture.
  return {
    ...base,
    category: "3D",
    assetType: inferModelAssetType(raw.categories),
    dimensionsMm: raw.dimensions,
    polycount: raw.polycount,
    hasLods: raw.lods,
  };
}
