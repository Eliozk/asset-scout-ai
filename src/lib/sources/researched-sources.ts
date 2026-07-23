/**
 * Sources researched during the Gemini/provider-expansion milestone that are
 * NOT wired into AssetScout's search — either because they're verified
 * eligible but not yet built (deliberately deferred, never claimed as live),
 * or because official terms/technical access made them ineligible. Every
 * entry here reflects real research against each source's own official
 * documentation/terms (never Reddit, unofficial wrappers, or scraping) —
 * see README's provider research matrix for the full evidence trail.
 *
 * Kept entirely separate from LIVE_API_SOURCES/AUTHORIZED_INDEXED_CATALOG_SOURCES
 * (integrated-sources.ts) and EXTERNAL_MARKETPLACES (marketplaces/registry.ts)
 * — nothing in this file is ever presented as searched or linked from the
 * Explore page. It exists purely so /sources can be honest about the full
 * scope of what was researched, not just what shipped.
 */

export type ResearchedClassification =
  | "LIVE_API"
  | "STATIC_AUTHORIZED_CATALOG"
  | "REJECTED";

export interface ResearchedSource {
  readonly id: string;
  readonly name: string;
  readonly classification: ResearchedClassification;
  readonly homepageUrl: string;
  /** Why this is deferred (for eligible-but-unbuilt) or excluded (for REJECTED) — always the real reason from research, never invented. */
  readonly reason: string;
}

/** Verified eligible (LIVE_API or STATIC_AUTHORIZED_CATALOG) but not yet implemented — deliberately deferred, never claimed as integrated. */
export const RESEARCHED_NOT_IMPLEMENTED_SOURCES: readonly ResearchedSource[] = [
  {
    id: "openclipart",
    name: "Openclipart",
    classification: "LIVE_API",
    homepageUrl: "https://openclipart.org",
    reason: "Verified official v2 search API (public domain, free app registration) — not yet implemented in this milestone.",
  },
  {
    id: "internet-archive",
    name: "Internet Archive",
    classification: "LIVE_API",
    homepageUrl: "https://archive.org",
    reason:
      "Verified official Advanced Search + metadata API, no key required — deferred because its catalog is far broader than game assets and needs careful query scoping before integrating.",
  },
  {
    id: "europeana",
    name: "Europeana",
    classification: "LIVE_API",
    homepageUrl: "https://www.europeana.eu",
    reason: "Verified official Search API for European cultural-heritage media — requires a free personal API key; not yet implemented.",
  },
  {
    id: "smithsonian-open-access",
    name: "Smithsonian Open Access",
    classification: "LIVE_API",
    homepageUrl: "https://www.si.edu/openaccess",
    reason: "Verified official Open Access API (CC0-flagged records only) — requires a free api.data.gov key; not yet implemented.",
  },
  {
    id: "game-icons-net",
    name: "Game-Icons.net",
    classification: "STATIC_AUTHORIZED_CATALOG",
    homepageUrl: "https://game-icons.net",
    reason:
      "No live API, but the full icon set + metadata is an official, redistributable static catalog (like Kenney's) — vendoring it at build time is a real future integration, not yet built.",
  },
];

/** Investigated and explicitly excluded — never integrated, never presented as searched. */
export const REJECTED_SOURCES: readonly ResearchedSource[] = [
  {
    id: "freesound",
    name: "Freesound",
    classification: "REJECTED",
    homepageUrl: "https://freesound.org",
    reason:
      "Its API Terms of Use permit free use only for non-commercial purposes; a public-facing portfolio product used by other people falls outside that without a separately negotiated agreement.",
  },
  {
    id: "blenderkit",
    name: "BlenderKit (now Blendkit)",
    classification: "REJECTED",
    homepageUrl: "https://www.blendkit.com",
    reason: "No public third-party REST API — its catalog is reachable only through the official Blender/Godot/Maya/Rhino add-ons, not an open web API.",
  },
  {
    id: "blend-swap",
    name: "Blend Swap",
    classification: "REJECTED",
    homepageUrl: "https://www.blendswap.com",
    reason: "No official API, and its own robots.txt explicitly disallows AI/automated crawlers (ClaudeBot, GPTBot, CCBot, and others).",
  },
  {
    id: "free3d",
    name: "Free3D",
    classification: "REJECTED",
    homepageUrl: "https://free3d.com",
    reason: "No official API could be verified, and bot protection blocked even a plain fetch of its own terms/robots.txt pages.",
  },
  {
    id: "adobe-substance-3d-assets",
    name: "Adobe Substance 3D Assets",
    classification: "REJECTED",
    homepageUrl: "https://substance3d.adobe.com/assets",
    reason: "Effectively subscription-gated — the library needs an authenticated Creative Cloud session, and Adobe's only public developer API is a paid rendering pipeline, not a catalog/search API.",
  },
];
