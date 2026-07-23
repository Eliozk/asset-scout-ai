import type { AssetLicense, AssetSearchResult } from "@/domain/asset";
import type { OpenverseRawResult } from "./raw-types";

/**
 * Maps Openverse's own machine-readable `license` slug (e.g. "cc0", "pdm",
 * "by", "by-sa", "by-nc") onto our existing AssetLicense enum. Only an exact
 * CC0/public-domain-mark or plain "by" (no -sa/-nc/-nd suffix) maps to a
 * specific enum value; every other real license maps to "Custom" with
 * Openverse's own ready-made `attribution` string preserved verbatim —
 * matching the same precedent used for Sketchfab/Wikimedia licenses our
 * enum has no dedicated slot for.
 */
function mapLicense(raw: OpenverseRawResult): { readonly license: AssetLicense; readonly licenseDetail?: string } {
  const slug = raw.license.toLowerCase();
  if (slug === "cc0" || slug === "pdm") {
    return { license: "CC0", licenseDetail: raw.attribution };
  }
  if (slug === "by") {
    return { license: "CC-BY", licenseDetail: raw.attribution };
  }
  return { license: "Custom", licenseDetail: raw.attribution ?? slug };
}

function formatResolution(raw: OpenverseRawResult): string | undefined {
  if (!raw.width || !raw.height) return undefined;
  return `${raw.width}×${raw.height}`;
}

/**
 * Pure mapper from one validated Openverse result into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parseOpenverseRawResult. Like Pixabay/Wikimedia, Openverse aggregates
 * general openly-licensed images (not verified game-ready asset packs), so
 * category/assetType follow the same honest, constant "2D Texture"
 * convention.
 *
 * Openverse's own Terms of Service require a site-wide "Made with
 * Openverse — not endorsed or certified by Openverse" attribution
 * (docs.openverse.org/terms_of_service.html); that notice lives on the
 * /sources page next to this provider's entry, not per-card, matching how
 * this app already surfaces per-source attribution notes.
 */
export function normalizeOpenverseResult(raw: OpenverseRawResult): AssetSearchResult {
  const { license, licenseDetail } = mapLicense(raw);

  return {
    id: `openverse:${raw.id}`,
    name: raw.title,
    description: "An openly-licensed image found via Openverse.",
    source: "openverse",
    category: "2D",
    assetType: "Texture",
    pricing: { model: "free" },
    license,
    licenseDetail,
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: (raw.tags ?? []).map((tag) => tag.name.toLowerCase()),
    matchScore: 50,
    whyItFits: "Openly-licensed image found via Openverse.",
    externalUrl: raw.foreign_landing_url,
    // Openverse's search response has no per-item publish date field.
    addedAt: new Date(0).toISOString().slice(0, 10),
    thumbnailUrl: raw.thumbnail,
    authors: raw.creator ? [raw.creator] : undefined,
    resolution: formatResolution(raw),
  };
}
