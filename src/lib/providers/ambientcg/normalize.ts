import type { AssetSearchResult } from "@/domain/asset";
import type { AmbientCGRawAsset } from "./raw-types";

/** Preference order — mid-size PNG first (crisp card, no wasted bandwidth), then JPG/WEBP fallbacks actually present on the asset. */
const THUMBNAIL_PREFERENCE = [
  "512-PNG",
  "512-JPG-FFFFFF",
  "512-WEBP",
  "256-PNG",
  "256-JPG-FFFFFF",
  "1024-PNG",
] as const;

function pickThumbnail(previewImage: Readonly<Record<string, string>>): string {
  for (const key of THUMBNAIL_PREFERENCE) {
    const url = previewImage[key];
    if (url) return url;
  }
  // Guaranteed non-empty by raw-types.ts's parsePreviewImage.
  return Object.values(previewImage)[0];
}

function formatPublishedDate(releaseDate: string | undefined): string {
  if (!releaseDate) return new Date(0).toISOString().slice(0, 10);
  const parsed = new Date(releaseDate);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

/**
 * Pure mapper from one validated ambientCG asset into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parseAmbientCGRawAsset. matchScore/whyItFits are neutral, query-independent
 * defaults here; the live provider always recomputes them per-query via
 * lib/search/relevance.ts.
 *
 * All ambientCG content is CC0 (docs.ambientcg.com/license/) — confirmed
 * site-wide, not per-asset, so this is a fixed literal, not a guess.
 */
export function normalizeAmbientCGAsset(raw: AmbientCGRawAsset): AssetSearchResult {
  const base = {
    name: raw.displayName,
    description: `A CC0 ${raw.dataType === "HDRI" ? "HDRI" : "PBR material"} from ambientCG.`,
    source: "ambientcg" as const,
    pricing: { model: "free" as const },
    license: "CC0" as const,
    engines: ["Engine-agnostic" as const],
    style: "Realistic" as const,
    tags: raw.tags.map((tag) => tag.toLowerCase()),
    matchScore: 50,
    whyItFits: "Free CC0 asset from ambientCG.",
    externalUrl: raw.shortLink,
    addedAt: formatPublishedDate(raw.releaseDate),
    thumbnailUrl: pickThumbnail(raw.previewImage),
    downloadCount: raw.downloadCount,
  };

  if (raw.dataType === "HDRI") {
    return {
      ...base,
      id: `ambientcg:${raw.assetId}`,
      category: "3D",
      assetType: "HDRI",
    };
  }

  return {
    ...base,
    id: `ambientcg:${raw.assetId}`,
    category: "both",
    assetType: "Texture",
  };
}
