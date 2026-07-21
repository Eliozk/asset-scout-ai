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
}

export function AssetCard({ asset, isFavorite, onToggleFavorite }: AssetCardProps) {
  const source = ASSET_SOURCES[asset.source];
  const hasFormats = asset.formats !== undefined && asset.formats.length > 0;
  const provenanceParts = [
    asset.authors && asset.authors.length > 0 ? `By ${asset.authors.join(", ")}` : null,
    asset.resolution ? asset.resolution : null,
    asset.downloadCount !== undefined ? `${asset.downloadCount.toLocaleString()} downloads` : null,
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
            {asset.license}
          </span>
          <MatchScoreBadge score={asset.matchScore} />
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
