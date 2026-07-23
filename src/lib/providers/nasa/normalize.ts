import type { AssetSearchResult } from "@/domain/asset";
import type { NasaRawItem } from "./raw-types";

/** Prefers a mid-size "preview" link (NASA's own thumbnail rel), then any "alternate" size, then the full-res "canonical" original as a last resort. */
function pickThumbnail(links: NasaRawItem["links"]): string {
  const preview = links.find((link) => link.rel === "preview");
  if (preview) return preview.href;
  const alternate = links.find((link) => link.rel === "alternate");
  if (alternate) return alternate.href;
  return links[0].href;
}

function formatPublishedDate(dateCreated: string | undefined): string {
  if (!dateCreated) return new Date(0).toISOString().slice(0, 10);
  const parsed = new Date(dateCreated);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

/**
 * Pure mapper from one validated NASA Image Library item into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parseNasaRawItem.
 *
 * License: NASA media is generally not copyrighted in the US
 * (nasa.gov/nasa-policies-and-guidelines-for-digital-and-social-media), the
 * closest fit in our enum to "public domain" is CC0 — licenseDetail keeps
 * NASA's own framing rather than implying an actual Creative Commons grant,
 * and flags the two real caveats from NASA's own guidelines: the NASA
 * insignia/logo must never be used to imply endorsement, and a small
 * fraction of items in the library carry third-party copyright.
 */
export function normalizeNasaItem(raw: NasaRawItem): AssetSearchResult {
  const author = raw.data.secondary_creator ?? raw.data.center;

  return {
    id: `nasa:${raw.data.nasa_id}`,
    name: raw.data.title,
    description: raw.data.description || `An image from NASA's Image and Video Library.`,
    source: "nasa",
    category: "2D",
    assetType: "Texture",
    pricing: { model: "free" },
    license: "CC0",
    licenseDetail:
      "Generally not copyrighted in the US per NASA's media guidelines — not a Creative Commons grant. A small number of library items carry third-party copyright; verify on the details page before commercial use. Never use the NASA insignia/logo to imply endorsement.",
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: (raw.data.keywords ?? []).map((keyword) => keyword.toLowerCase()),
    matchScore: 50,
    whyItFits: "Public-domain image from NASA's Image and Video Library.",
    externalUrl: `https://images.nasa.gov/details/${raw.data.nasa_id}`,
    addedAt: formatPublishedDate(raw.data.date_created),
    thumbnailUrl: pickThumbnail(raw.links),
    authors: author ? [author] : undefined,
  };
}
