/**
 * Raw shape of one `<item>` from Kenney's official RSS feed at
 * https://kenney.nl/feed ("Latest game assets"), verified directly against
 * the live public feed (2026-07) — publicly accessible, no auth, no account.
 *
 * The feed is deliberately small (the ~25 most recent asset-pack releases,
 * not Kenney's full historical catalog) and does NOT include a per-item
 * license field. Every item verified from this feed belongs to Kenney's
 * "Assets" section, which Kenney's own asset pages consistently and
 * explicitly label "License Creative Commons CC0" (confirmed by directly
 * checking several real asset pages across all three categories seen in the
 * feed — see normalize.ts for where that constant is applied).
 */

export interface KenneyRawFeedItem {
  readonly title: string;
  readonly link: string;
  readonly guid: string;
  readonly pubDate: string;
  /** One of "2D", "3D", "Textures" in every item observed live. */
  readonly category: string;
  readonly imageUrl: string;
  /** Raw CDATA description text, e.g. "This 3D pack ... contains 40 files. It is tagged as: tiles, modular, cave". */
  readonly description: string;
}

const TRUSTED_LINK_PREFIX = "https://kenney.nl/assets/";
const TRUSTED_IMAGE_PREFIX = "https://kenney.nl/media/";

export interface KenneyRawFieldSet {
  readonly title: string | null;
  readonly link: string | null;
  readonly guid: string | null;
  readonly pubDate: string | null;
  readonly category: string | null;
  readonly imageUrl: string | null;
  readonly description: string | null;
}

/**
 * Validates one already-field-extracted feed item (see parse-feed.ts for the
 * XML-to-fields step). Returns null (never throws) for anything malformed or
 * untrusted, so one bad entry can't take down the whole catalog generation
 * run.
 */
export function parseKenneyRawFeedItem(fields: KenneyRawFieldSet): KenneyRawFeedItem | null {
  const { title, link, guid, pubDate, category, imageUrl, description } = fields;

  if (typeof title !== "string" || title.trim() === "") return null;
  if (typeof link !== "string" || !link.startsWith(TRUSTED_LINK_PREFIX)) return null;
  if (typeof guid !== "string" || guid.trim() === "") return null;
  if (typeof category !== "string" || category.trim() === "") return null;
  if (typeof imageUrl !== "string" || !imageUrl.startsWith(TRUSTED_IMAGE_PREFIX)) return null;
  if (typeof description !== "string") return null;

  if (typeof pubDate !== "string") return null;
  const parsedDate = new Date(pubDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return { title, link, guid, pubDate, category, imageUrl, description };
}

/**
 * Extracts the comma-separated tag list from the feed's own description
 * text — the feed has no dedicated tags field, but every item observed live
 * ends its description with the fixed phrase "It is tagged as: a, b, c".
 * Returns an empty array (never throws) if that phrase isn't found, since a
 * missing tag list shouldn't exclude an otherwise-valid entry.
 */
export function extractTagsFromDescription(description: string): readonly string[] {
  const match = /tagged as:\s*(.+)$/i.exec(description.trim());
  if (!match) return [];
  return match[1]
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

/** Extracts the asset-pack slug (e.g. "modular-cave-kit") from a trusted Kenney asset link. */
export function extractSlugFromLink(link: string): string | null {
  if (!link.startsWith(TRUSTED_LINK_PREFIX)) return null;
  const slug = link.slice(TRUSTED_LINK_PREFIX.length).replace(/\/+$/, "");
  return slug.length > 0 ? slug : null;
}
