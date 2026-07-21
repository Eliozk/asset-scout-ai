import type { AssetDimension, AssetSearchResult, AssetStyle, AssetType } from "@/domain/asset";
import { extractSlugFromLink, extractTagsFromDescription, type KenneyRawFeedItem } from "./raw-types";

/**
 * Kenney's own asset pages (verified directly, 2026-07, across all three
 * categories seen in the feed: "Skyboxes" [Textures], "Input Prompts" [2D],
 * "Modular Cave Kit" [3D]) each explicitly state "License Creative Commons
 * CC0". The feed itself has no per-item license field, so this is applied
 * as Kenney's confirmed, site-wide Assets-section licensing rule — never a
 * guess, and never applied outside this feed's scope (Kenney's Tools/Games
 * sections aren't indexed here at all).
 */
const KENNEY_LICENSE = "CC0" as const;

const TAG_TO_ASSET_TYPE: Readonly<Record<string, AssetType>> = {
  vehicle: "Vehicle",
  vehicles: "Vehicle",
  car: "Vehicle",
  cars: "Vehicle",
  truck: "Vehicle",
  weapon: "Weapon",
  weapons: "Weapon",
  gun: "Weapon",
  blaster: "Weapon",
  character: "Character",
  characters: "Character",
  pets: "Character",
  pet: "Character",
  animal: "Character",
  animals: "Character",
  ui: "UI",
  interface: "UI",
  button: "UI",
  gamepad: "UI",
  control: "UI",
  prompt: "UI",
  input: "UI",
  dungeon: "Environment",
  cave: "Environment",
  town: "Environment",
  city: "Environment",
  graveyard: "Environment",
  space: "Environment",
  forest: "Environment",
  farm: "Environment",
  factory: "Environment",
  desert: "Environment",
  skybox: "Environment",
  sky: "Environment",
};

/**
 * Heuristic, not a verified per-asset fact: Kenney's feed provides no
 * asset-type field, so this infers from real tags/category, falling back to
 * "Texture" for the Textures category and "Prop" otherwise — the same
 * documented-heuristic approach used for Sketchfab (see
 * lib/providers/sketchfab/normalize.ts).
 */
export function inferAssetType(category: string, tags: readonly string[]): AssetType {
  for (const tag of tags) {
    const mapped = TAG_TO_ASSET_TYPE[tag];
    if (mapped) return mapped;
  }
  if (category === "Textures") return "Texture";
  return "Prop";
}

/**
 * Heuristic: Kenney's 3D packs are consistently in their signature low-poly
 * style and 2D packs are consistently flat cartoon-style sprites/icons —
 * both well-established, publicly visible facts about Kenney's asset style,
 * but still a heuristic default rather than a per-item verified field.
 */
export function inferStyle(category: string, tags: readonly string[]): AssetStyle {
  if (tags.includes("pixel")) return "Pixel-art";
  if (category === "3D") return "Low-poly";
  if (category === "2D") return "Cartoon";
  return "Realistic";
}

/** A flat texture is equally usable in 2D or 3D work — same "both" concept already used for Poly Haven textures. */
export function mapDimension(category: string): AssetDimension {
  if (category === "3D") return "3D";
  if (category === "2D") return "2D";
  return "both";
}

function formatAddedAt(pubDate: string): string {
  const date = new Date(pubDate);
  return date.toISOString().slice(0, 10);
}

/**
 * Pure: normalizes one validated raw Kenney feed item into the shared
 * AssetSearchResult shape. matchScore/whyItFits are neutral placeholders —
 * the provider overwrites both per-query via the same deterministic
 * relevance scorer used for every other live source.
 */
export function normalizeKenneyItem(raw: KenneyRawFeedItem): AssetSearchResult {
  const tags = extractTagsFromDescription(raw.description);
  const slug = extractSlugFromLink(raw.link) ?? raw.guid;

  return {
    id: `kenney:${slug}`,
    name: raw.title,
    description: raw.description,
    source: "kenney",
    category: mapDimension(raw.category),
    assetType: inferAssetType(raw.category, tags),
    pricing: { model: "free" },
    license: KENNEY_LICENSE,
    engines: ["Engine-agnostic"],
    style: inferStyle(raw.category, tags),
    tags,
    matchScore: 50,
    whyItFits: "Game asset pack from Kenney's Authorized Indexed Catalog.",
    externalUrl: raw.link,
    addedAt: formatAddedAt(raw.pubDate),
    thumbnailUrl: raw.imageUrl,
  };
}
