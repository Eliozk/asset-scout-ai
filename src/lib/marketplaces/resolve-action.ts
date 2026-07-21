import type { ExternalMarketplace } from "./registry";

export interface MarketplaceAction {
  /** "Search on {name}" or "Browse {name}" — never claims "Search" unless a real query will actually be sent. */
  readonly label: string;
  readonly href: string;
  readonly isSearch: boolean;
}

/**
 * Pure: decides what a marketplace card should say and link to for the
 * current query. Even a marketplace that supports search shows "Browse"
 * (and links to its homepage) when the query is blank — never claims to
 * search for nothing. Shared by MarketplaceSearchHub and its tests so the
 * UI and the verified behavior can never drift apart.
 */
export function resolveMarketplaceAction(marketplace: ExternalMarketplace, query: string): MarketplaceAction {
  const trimmed = query.trim();
  const canSearch = marketplace.supportsQuery && trimmed !== "";

  return {
    label: canSearch ? `Search on ${marketplace.name}` : `Browse ${marketplace.name}`,
    href: canSearch ? marketplace.buildUrl(trimmed) : marketplace.homepageUrl,
    isSearch: canSearch,
  };
}
