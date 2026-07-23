import type { AssetLicense, AssetSearchResult } from "@/domain/asset";
import type { WikimediaRawPage } from "./raw-types";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function getMeta(raw: WikimediaRawPage, key: string): string | undefined {
  return raw.imageinfo[0]?.extmetadata?.[key]?.value;
}

/**
 * Maps Wikimedia's machine-readable `License` extmetadata field (e.g.
 * "cc0-1.0", "cc-by-4.0", "cc-by-sa-4.0", "pd-old") onto our existing
 * AssetLicense enum. Only an exact, unambiguous CC0/public-domain or plain
 * CC-BY (no -SA/-NC/-ND suffix) maps to a specific enum value; every other
 * real license (CC BY-SA, CC BY-NC, custom, or simply absent) maps to
 * "Custom" with the human-readable LicenseShortName preserved verbatim in
 * licenseDetail — never silently collapsed into a falsely-permissive
 * bucket, matching the Sketchfab provider's identical precedent for
 * licenses our enum has no dedicated slot for.
 */
function mapLicense(raw: WikimediaRawPage): { readonly license: AssetLicense; readonly licenseDetail?: string } {
  const code = (getMeta(raw, "License") ?? "").toLowerCase();
  const shortName = getMeta(raw, "LicenseShortName");

  if (code === "") {
    return { license: "Custom", licenseDetail: shortName ?? "Unknown/unverified — verify the license on Wikimedia Commons." };
  }
  if (code.startsWith("cc0") || code.startsWith("pd") || code.includes("public domain")) {
    return { license: "CC0" };
  }
  if (/^cc-by-\d/.test(code)) {
    return { license: "CC-BY", licenseDetail: shortName };
  }
  return { license: "Custom", licenseDetail: shortName ?? code };
}

function fileTitleToDisplayName(title: string): string {
  const withoutPrefix = title.replace(/^File:/, "");
  const withoutExtension = withoutPrefix.replace(/\.[a-zA-Z0-9]+$/, "");
  return withoutExtension.replace(/_/g, " ").trim() || withoutPrefix;
}

function formatResolution(raw: WikimediaRawPage): string | undefined {
  const info = raw.imageinfo[0];
  if (!info?.width || !info?.height) return undefined;
  return `${info.width}×${info.height}`;
}

/**
 * Pure mapper from one validated Wikimedia Commons page into our normalized
 * AssetSearchResult. Never throws — assumes `raw` already passed
 * parseWikimediaRawPage. Like Pixabay, Commons search results are general
 * images/scans, not verified game-ready asset packs, so category/assetType
 * follow the same honest, constant "2D Texture" convention Pixabay already
 * uses rather than guessing a more specific type from an arbitrary category
 * string.
 */
export function normalizeWikimediaPage(raw: WikimediaRawPage): AssetSearchResult {
  const info = raw.imageinfo[0];
  const { license, licenseDetail } = mapLicense(raw);
  const rawArtist = getMeta(raw, "Artist");
  const author = rawArtist ? stripHtml(rawArtist) : undefined;

  return {
    id: `wikimedia:${raw.pageid}`,
    name: fileTitleToDisplayName(raw.title),
    description: "An openly-licensed image from Wikimedia Commons.",
    source: "wikimedia",
    category: "2D",
    assetType: "Texture",
    pricing: { model: "free" },
    license,
    licenseDetail,
    engines: ["Engine-agnostic"],
    style: "Realistic",
    tags: [],
    matchScore: 50,
    whyItFits: "Openly-licensed image from Wikimedia Commons.",
    externalUrl: info.descriptionurl,
    // Commons' search API doesn't return an upload date in this response shape.
    addedAt: new Date(0).toISOString().slice(0, 10),
    thumbnailUrl: info.thumburl,
    authors: author ? [author] : undefined,
    resolution: formatResolution(raw),
  };
}
