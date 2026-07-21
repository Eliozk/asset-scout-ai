import type { AssetSearchResult, AssetStyle } from "@/domain/asset";
import { splitPixabayTags, type PixabayRawHit } from "./raw-types";

/**
 * Pixabay's own API docs describe its content as "royalty-free images and
 * videos released by Pixabay under the Content License" — a distinct,
 * Pixabay-specific license, not Creative Commons. "Royalty-Free" is the
 * closest match in our enum; licenseDetail keeps Pixabay's own naming
 * rather than letting it read as CC0/CC-BY.
 * Source: https://pixabay.com/api/docs/ (fetched live, 2026-07).
 */
const PIXABAY_LICENSE = "Royalty-Free" as const;
const PIXABAY_LICENSE_DETAIL = "Pixabay Content License";

/**
 * Heuristic tied directly to Pixabay's own `type` field — a real photo is
 * "Realistic"; illustrations and vector graphics are generally flat/stylized
 * artwork. Not a claim about any specific image's artistic style.
 */
function inferStyle(type: string): AssetStyle {
  if (type === "photo") return "Realistic";
  return "Stylized";
}

/**
 * Deliberately constant, not tag-inferred: unlike Sketchfab/Kenney (actual
 * game-ready asset packs), Pixabay hits are stock photography/illustrations
 * — a photo *of* a car or a person is not a usable Vehicle/Character game
 * asset, and guessing an asset type from an arbitrary stock-photo tag would
 * misrepresent it as one. "Texture" is the closest honest fit for generic
 * flat 2D image content with no further verified signal.
 */
const PIXABAY_ASSET_TYPE = "Texture" as const;

function formatResolution(hit: PixabayRawHit): string | undefined {
  if (hit.imageWidth === undefined || hit.imageHeight === undefined) return undefined;
  return `${hit.imageWidth}×${hit.imageHeight}`;
}

/**
 * Pure mapper from one validated Pixabay hit into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parsePixabayRawHit. matchScore/whyItFits are neutral, query-independent
 * placeholders; the live provider recomputes both per-query.
 *
 * Pixabay has no per-image title or publish-date field at all, and — unlike
 * Sketchfab/Poly Haven — its category is never inherently 3D, so `category`
 * is always "2D" here (never "both"), since claiming 3D/material usability
 * for a stock photo would overstate what's actually known about it.
 */
export function normalizePixabayHit(raw: PixabayRawHit): AssetSearchResult {
  const tags = splitPixabayTags(raw.tags);
  const name = raw.tags.trim() !== "" ? raw.tags : `Pixabay ${raw.type} #${raw.id}`;

  return {
    id: `pixabay:${raw.id}`,
    name,
    description: `A ${raw.type} from Pixabay.`,
    source: "pixabay",
    category: "2D",
    assetType: PIXABAY_ASSET_TYPE,
    pricing: { model: "free" },
    license: PIXABAY_LICENSE,
    licenseDetail: PIXABAY_LICENSE_DETAIL,
    engines: ["Engine-agnostic"],
    style: inferStyle(raw.type),
    tags,
    matchScore: 50,
    whyItFits: "Stock image from Pixabay.",
    externalUrl: raw.pageURL,
    // Pixabay's API returns no publish-date field for images at all — this
    // sentinel (matching the Sketchfab precedent for "no real date
    // available") signals "unknown", never an invented specific date.
    addedAt: new Date(0).toISOString().slice(0, 10),
    thumbnailUrl: raw.webformatURL,
    authors: [raw.user],
    downloadCount: raw.downloads,
    resolution: formatResolution(raw),
  };
}
