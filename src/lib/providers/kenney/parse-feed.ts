import { parseKenneyRawFeedItem, type KenneyRawFeedItem } from "./raw-types";

export interface KenneyFeedParseResult {
  readonly items: readonly KenneyRawFeedItem[];
  readonly totalUpstream: number;
  readonly skipped: number;
}

const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
};

function decodeXmlEntities(value: string): string {
  return value.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;/g, (entity) => XML_ENTITIES[entity]);
}

function extractTag(itemXml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i").exec(itemXml);
  if (!match) return null;
  const raw = match[1].trim();
  const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(raw);
  return decodeXmlEntities(cdataMatch ? cdataMatch[1].trim() : raw);
}

function extractEnclosureUrl(itemXml: string): string | null {
  const match = /<enclosure\s+([^>]*)\/?>/i.exec(itemXml);
  if (!match) return null;
  const urlMatch = /url=(?:"([^"]*)"|'([^']*)')/i.exec(match[1]);
  if (!urlMatch) return null;
  return decodeXmlEntities(urlMatch[1] ?? urlMatch[2] ?? "");
}

/**
 * Pure: splits a raw RSS 2.0 XML document (as served by
 * https://kenney.nl/feed) into validated, normalized-ready raw items.
 * Never throws on a malformed individual `<item>` — it's skipped and
 * counted, matching the "skip malformed, never throw" rule used for every
 * other provider in this app. Deliberately not a general-purpose XML parser
 * — Kenney's feed has a small, fixed, verified shape, so a regex-based
 * field extraction keeps this dependency-free.
 */
export function parseKenneyFeedXml(xml: string): KenneyFeedParseResult {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const items: KenneyRawFeedItem[] = [];
  let skipped = 0;

  for (const block of itemBlocks) {
    try {
      const parsed = parseKenneyRawFeedItem({
        title: extractTag(block, "title"),
        link: extractTag(block, "link"),
        guid: extractTag(block, "guid"),
        pubDate: extractTag(block, "pubDate"),
        category: extractTag(block, "category"),
        imageUrl: extractEnclosureUrl(block),
        description: extractTag(block, "description"),
      });
      if (!parsed) {
        skipped += 1;
        continue;
      }
      items.push(parsed);
    } catch {
      skipped += 1;
    }
  }

  return { items, totalUpstream: itemBlocks.length, skipped };
}
