/**
 * Registry of external asset marketplaces AssetScout links out to, but never
 * searches, scrapes, or integrates with. Every entry here is completely
 * separate from AssetSearchResult/AssetSourceId (src/domain/asset) — these
 * are outbound links only, never rendered inside the verified results grid
 * and never favoritable.
 *
 * Each `mode`/`buildUrl` decision below was verified directly (2026-07)
 * against each marketplace's own public pages — never via scraping, an
 * undocumented API, or browser automation:
 *
 * - "outbound-search": the marketplace's own server-rendered response
 *   visibly reflected a real query (e.g. a pre-filled search box value, a
 *   changed page title, or a server-preloaded state blob containing the
 *   query) when fetched directly.
 * - "outbound-browse": no such reflection could be confirmed (a
 *   client-side-only search UI, a login-gated app, or a site whose bot
 *   protection blocked even a plain fetch of its homepage) — so the link
 *   only ever opens the official homepage/browse page, never a
 *   constructed-but-unverified "search" URL.
 */

export type MarketplaceIntegrationMode = "outbound-search" | "outbound-browse";

export interface ExternalMarketplace {
  readonly id: string;
  readonly name: string;
  readonly specialties: readonly string[];
  readonly mode: MarketplaceIntegrationMode;
  readonly homepageUrl: string;
  /** Short, plain-language limitation shown to the user — never invented, always grounded in the verification above. */
  readonly limitation: string;
  /** True only for "outbound-search" entries — whether buildUrl(query) actually varies the destination. */
  readonly supportsQuery: boolean;
  /**
   * How supportsQuery entries encode the query into the URL — a
   * query-string parameter (the default/original pattern, e.g. ?q=...) or a
   * URL PATH segment (e.g. texturecan.com/search/{query}/1/, the only
   * pattern verified to actually work for that specific site). Absent for
   * outbound-browse entries.
   */
  readonly searchUrlStyle?: "query-string" | "path";
  /**
   * Builds the outbound URL for a given (already-trimmed) query. Always
   * returns a URL on this entry's own hard-coded HTTPS host — `query` can
   * only ever become the *value* of a query-string parameter (via
   * URLSearchParams, which percent-encodes it), never part of the host,
   * path, protocol, or an additional parameter. For "outbound-browse"
   * entries, or when supportsQuery is false, this always returns homepageUrl
   * regardless of input.
   */
  buildUrl(query: string): string;
}

/**
 * Safely builds `{base}?{param}={query}` using URLSearchParams, which
 * percent-encodes the value regardless of content — Hebrew, punctuation,
 * whitespace, or hostile-looking strings like `javascript:...` or
 * `&other=param` all become an inert, correctly-escaped parameter value,
 * never a way to change the URL's host, protocol, or add extra parameters.
 * A blank/whitespace-only query falls back to the homepage instead of
 * producing a "search for nothing" URL.
 */
function buildSearchUrl(base: string, param: string, query: string, homepageUrl: string): string {
  const trimmed = query.trim();
  if (trimmed === "") return homepageUrl;
  const url = new URL(base);
  url.searchParams.set(param, trimmed);
  return url.toString();
}

/**
 * True for a query that consists ENTIRELY of "." characters (".", "..",
 * "...", ...) once trimmed. Verified empirically (not just by RFC 3986
 * reading) against the real WHATWG URL implementation: percent-encoding a
 * pure dot-segment's dots (e.g. ".." -> "%2E%2E") does NOT stop
 * `url.pathname = "/search/%2E%2E/1/"` from still collapsing to "/1/" —
 * this runtime decodes-and-normalizes dot segments even through percent
 * escapes, so encoding alone can't make a PURE "." or ".." segment safe.
 * A MIXED string containing dots plus other characters (e.g.
 * "../../etc/passwd", one of the hostile-input test fixtures) is unaffected
 * — verified it stays intact as one literal path segment, "/search/" prefix
 * preserved — so this guard only needs to catch the pure-dots case.
 */
function isOnlyDots(value: string): boolean {
  return /^\.+$/.test(value);
}

/**
 * Percent-encodes one query as a single URL PATH segment (for marketplaces
 * whose only verified search URL is path-based, e.g. texturecan.com/search/
 * {query}/1/, not a query-string parameter). A pure-dots query has no safe
 * path-segment representation in this URL engine (see isOnlyDots) and falls
 * back to the homepage, same as an empty query — it's a degenerate,
 * meaningless search term anyway, not a real loss of functionality.
 */
function buildPathSearchUrl(baseOrigin: string, pathTemplate: (encodedQuery: string) => string, query: string, homepageUrl: string): string {
  const trimmed = query.trim();
  if (trimmed === "" || isOnlyDots(trimmed)) return homepageUrl;
  const url = new URL(baseOrigin);
  url.pathname = pathTemplate(encodeURIComponent(trimmed));
  return url.toString();
}

export const EXTERNAL_MARKETPLACES: readonly ExternalMarketplace[] = [
  {
    id: "unity-asset-store-external",
    name: "Unity Asset Store",
    specialties: ["Unity packages", "3D & 2D assets", "tools & templates"],
    mode: "outbound-search",
    homepageUrl: "https://assetstore.unity.com/",
    limitation:
      "Opens Unity's own search results in a new tab — AssetScout does not read prices, licenses, or Unity-version compatibility from it.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://assetstore.unity.com/search", "q", query, "https://assetstore.unity.com/"),
  },
  {
    id: "fab-external",
    name: "Fab",
    specialties: ["Unreal Engine assets", "3D models", "environments"],
    mode: "outbound-search",
    homepageUrl: "https://www.fab.com/",
    limitation:
      "Opens Fab's own search results in a new tab — AssetScout does not read prices, licenses, or engine compatibility from it.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://www.fab.com/search", "q", query, "https://www.fab.com/"),
  },
  {
    id: "itchio-assets-external",
    name: "itch.io",
    specialties: ["indie game assets", "tools", "soundtracks"],
    mode: "outbound-search",
    homepageUrl: "https://itch.io/game-assets",
    limitation:
      "This opens itch.io's site-wide search (games, tools, everything) — a way to scope it to just game assets couldn't be verified, so it isn't assumed.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://itch.io/search", "q", query, "https://itch.io/game-assets"),
  },
  {
    id: "opengameart-external",
    name: "OpenGameArt",
    specialties: ["free & open-licensed 2D/3D art", "audio"],
    mode: "outbound-search",
    homepageUrl: "https://opengameart.org/",
    limitation: "Opens OpenGameArt's own search — always check the exact license shown on each individual submission there.",
    supportsQuery: true,
    buildUrl: (query) =>
      buildSearchUrl("https://opengameart.org/art-search-advanced", "keys", query, "https://opengameart.org/"),
  },
  {
    id: "craftpix-external",
    name: "CraftPix",
    specialties: ["2D game assets", "UI kits", "backgrounds"],
    mode: "outbound-search",
    homepageUrl: "https://craftpix.net/",
    limitation: "Opens CraftPix's own search — many listings are paid; this link doesn't distinguish free from paid.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://craftpix.net/", "s", query, "https://craftpix.net/"),
  },
  {
    id: "artstation-marketplace-external",
    name: "ArtStation Marketplace",
    specialties: ["character & environment art", "brushes", "3D models"],
    mode: "outbound-browse",
    homepageUrl: "https://www.artstation.com/marketplace",
    limitation:
      "ArtStation's marketplace search runs entirely in the browser after the page loads, so a linkable search URL couldn't be verified — this opens the marketplace to browse instead.",
    supportsQuery: false,
    buildUrl: () => "https://www.artstation.com/marketplace",
  },
  {
    id: "gamedev-market-external",
    name: "GameDev Market",
    specialties: ["2D/3D game assets", "music", "code"],
    mode: "outbound-browse",
    homepageUrl: "https://www.gamedevmarket.net/",
    limitation:
      "GameDev Market's search runs entirely in the browser after the page loads, so a linkable search URL couldn't be verified — this opens the homepage to browse instead.",
    supportsQuery: false,
    buildUrl: () => "https://www.gamedevmarket.net/",
  },
  {
    id: "turbosquid-external",
    name: "TurboSquid",
    specialties: ["professional 3D models"],
    mode: "outbound-browse",
    homepageUrl: "https://www.turbosquid.com/",
    limitation:
      "TurboSquid's bot protection blocked automated verification of any of its pages, including its own homepage — this link opens the well-known public homepage to browse instead of an unverified search URL.",
    supportsQuery: false,
    buildUrl: () => "https://www.turbosquid.com/",
  },
  {
    id: "cgtrader-external",
    name: "CGTrader",
    specialties: ["3D models", "professional & indie assets"],
    mode: "outbound-search",
    homepageUrl: "https://www.cgtrader.com/",
    limitation: "Opens CGTrader's own search — pricing and license vary per model and aren't read by AssetScout.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://www.cgtrader.com/search", "keywords", query, "https://www.cgtrader.com/"),
  },
  {
    id: "mixamo-external",
    name: "Mixamo",
    specialties: ["character rigging", "animations"],
    mode: "outbound-browse",
    homepageUrl: "https://www.mixamo.com/",
    limitation:
      "Mixamo requires a free Adobe account to browse or search its characters and animations, and its browsing UI isn't reachable by a plain link — this opens Mixamo's homepage.",
    supportsQuery: false,
    buildUrl: () => "https://www.mixamo.com/",
  },
  {
    id: "texturecan-external",
    name: "TextureCan",
    specialties: ["PBR textures"],
    mode: "outbound-search",
    homepageUrl: "https://www.texturecan.com/",
    limitation:
      "No official API exists — opens TextureCan's own search results in a new tab (verified live: /search/{query}/1/ reflects the real query). AssetScout does not read license or commercial-use terms from it.",
    supportsQuery: true,
    searchUrlStyle: "path",
    buildUrl: (query) =>
      buildPathSearchUrl("https://www.texturecan.com", (q) => `/search/${q}/1/`, query, "https://www.texturecan.com/"),
  },
  {
    id: "productioncrate-external",
    name: "ProductionCrate",
    specialties: ["VFX assets", "3D models", "textures"],
    mode: "outbound-search",
    homepageUrl: "https://vfx.productioncrate.com/",
    limitation:
      "No official API exists, and its Free/Personal/Pro tiers explicitly exclude corporate/institutional use per its own Terms — opens ProductionCrate's own search in a new tab; AssetScout never fetches or displays its content directly.",
    supportsQuery: true,
    buildUrl: (query) => buildSearchUrl("https://vfx.productioncrate.com/search", "s", query, "https://vfx.productioncrate.com/"),
  },
  {
    id: "cgbookcase-external",
    name: "CGBookcase",
    specialties: ["PBR textures"],
    mode: "outbound-browse",
    homepageUrl: "https://www.cgbookcase.com/textures",
    limitation:
      "All textures are CC0, but no API and no verified query-preserving search URL exist — this opens CGBookcase's textures browse page instead of an unverified search URL.",
    supportsQuery: false,
    buildUrl: () => "https://www.cgbookcase.com/textures",
  },
  {
    id: "quaternius-external",
    name: "Quaternius",
    specialties: ["low-poly 3D packs"],
    mode: "outbound-browse",
    homepageUrl: "https://quaternius.com/assets.html",
    limitation:
      "All packs are CC0 and free, but there is no API, feed, or search — this opens Quaternius's own asset browse page.",
    supportsQuery: false,
    buildUrl: () => "https://quaternius.com/assets.html",
  },
];
