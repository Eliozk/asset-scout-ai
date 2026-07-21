import { ExternalLink } from "lucide-react";
import type { AssetSearchResult } from "@/domain/asset";
import { ASSET_SOURCES } from "@/domain/asset";
import { formatPricing } from "@/lib/format";
import { AssetPreview } from "./AssetPreview";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { FavoriteButton } from "./FavoriteButton";

interface AssetCardProps {
  readonly asset: AssetSearchResult;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  /** Present only when the local semantic model successfully scored this specific asset for the current query. */
  readonly semanticScore?: number;
}

export function AssetCard({ asset, isFavorite, onToggleFavorite, semanticScore }: AssetCardProps) {
  const source = ASSET_SOURCES[asset.source];
  const hasFormats = asset.formats !== undefined && asset.formats.length > 0;
  // Sketchfab's terms require visible per-result attribution: creator, license,
  // link to the original model (the "View original" button below), and a
  // "Provided by Sketchfab" credit. Creator + license are already covered by
  // the provenance/license display; this adds the required explicit credit.
  // Kenney results similarly must be marked as coming from an "Authorized
  // Indexed Catalog" (a curated static snapshot of Kenney's official feed,
  // not a live/full-catalog integration) rather than blending in silently.
  // Pixabay's API terms require showing users where results are from
  // whenever they're displayed — the source label above already does this
  // generically, but this line makes it explicit and unambiguous per-result.
  const provenanceParts = [
    asset.authors && asset.authors.length > 0 ? `By ${asset.authors.join(", ")}` : null,
    asset.resolution ? asset.resolution : null,
    asset.downloadCount !== undefined ? `${asset.downloadCount.toLocaleString()} downloads` : null,
    asset.source === "sketchfab" ? "Provided by Sketchfab" : null,
    asset.source === "kenney" ? "Kenney — Authorized Indexed Catalog" : null,
    asset.source === "pixabay" ? "Image provided by Pixabay" : null,
  ].filter((part): part is string => part !== null);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated transition-colors hover:border-border-strong">
      <AssetPreview asset={asset} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-snug text-foreground">{asset.name}</h3>
            <p className="mt-0.5 text-xs text-text-faint">{source.label}</p>
          </div>
          <FavoriteButton assetName={asset.name} isFavorite={isFavorite} onToggle={onToggleFavorite} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-md border border-border-strong px-2 py-0.5 text-text-muted">
            {formatPricing(asset.pricing)}
          </span>
          <span className="rounded-md border border-border-strong px-2 py-0.5 text-text-muted">
            {asset.licenseDetail ?? asset.license}
          </span>
          {semanticScore !== undefined ? (
            <MatchScoreBadge score={semanticScore} mode="ai" />
          ) : (
            <MatchScoreBadge score={asset.matchScore} mode="keyword" />
          )}
        </div>

        <p className="text-xs leading-relaxed text-text-muted">
          <span className="font-medium text-accent-cyan">Why it fits: </span>
          {asset.whyItFits}
        </p>

        <div className="mt-auto flex flex-col gap-1 border-t border-border-subtle pt-3 text-xs text-text-faint">
          {hasFormats && (
            <p>
              <span className="text-text-muted">Formats:</span> {asset.formats!.join(", ")}
            </p>
          )}
          <p>
            <span className="text-text-muted">Engines:</span> {asset.engines.join(", ")}
          </p>
          {provenanceParts.length > 0 && <p>{provenanceParts.join(" · ")}</p>}
        </div>

        <a
          href={asset.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          View original
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
