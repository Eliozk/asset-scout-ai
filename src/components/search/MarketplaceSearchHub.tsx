import { ExternalLink } from "lucide-react";
import { EXTERNAL_MARKETPLACES } from "@/lib/marketplaces/registry";
import { resolveMarketplaceAction } from "@/lib/marketplaces/resolve-action";

interface MarketplaceSearchHubProps {
  readonly query: string;
}

/**
 * Outbound links only — never rendered inside the verified results grid,
 * never favoritable, never shown with a match score/price/license/thumbnail.
 * AssetScout does not search, scrape, or verify anything from these
 * marketplaces; every card just opens the marketplace itself in a new tab.
 */
export function MarketplaceSearchHub({ query }: MarketplaceSearchHubProps) {
  return (
    <section aria-labelledby="marketplace-hub-heading" className="mt-14 border-t border-border-subtle pt-8">
      <h2 id="marketplace-hub-heading" className="text-base font-semibold text-foreground">
        Search more asset marketplaces
      </h2>
      <p className="mt-1 max-w-2xl text-xs text-text-muted">
        These marketplaces are opened externally. AssetScout does not retrieve or verify their results,
        prices, licenses, or compatibility.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {EXTERNAL_MARKETPLACES.map((marketplace) => {
          const action = resolveMarketplaceAction(marketplace, query);
          return (
            <li key={marketplace.id}>
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${action.label} (opens in a new tab)`}
                title={marketplace.limitation}
                className="focus-ring flex h-full flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-elevated"
              >
                <span className="inline-flex w-fit items-center rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-faint">
                  External marketplace
                </span>
                <span className="text-sm font-semibold text-foreground">{marketplace.name}</span>
                <span className="text-[11px] leading-snug text-text-muted">{marketplace.specialties.join(", ")}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-accent-cyan">
                  {action.label}
                  <ExternalLink size={12} aria-hidden="true" />
                </span>
                {!action.isSearch && marketplace.supportsQuery && (
                  <span className="text-[10px] text-text-faint">Type a search above to search here directly.</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
