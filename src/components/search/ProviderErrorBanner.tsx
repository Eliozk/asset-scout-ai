import { AlertTriangle } from "lucide-react";
import type { AssetSourceId } from "@/domain/asset";
import { ASSET_SOURCES } from "@/domain/asset";
import type { ProviderOutcome } from "@/lib/search/aggregate-providers";

/** Maps a provider id (e.g. "sketchfab-live") to its display source, when recognized. */
const PROVIDER_ID_TO_SOURCE: Readonly<Record<string, AssetSourceId>> = {
  "polyhaven-live": "polyhaven",
  "sketchfab-live": "sketchfab",
  "kenney-catalog": "kenney",
};

interface ProviderErrorBannerProps {
  readonly providerOutcomes: readonly ProviderOutcome[];
}

/**
 * Small, non-blocking notice for partial provider failure — shown alongside
 * (never instead of) whatever results the healthy providers returned. Never
 * rendered when every provider is fine, and never blocks the results grid.
 */
export function ProviderErrorBanner({ providerOutcomes }: ProviderErrorBannerProps) {
  const failed = providerOutcomes.filter((outcome) => outcome.status === "rejected");
  if (failed.length === 0) return null;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-200">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
      <p>
        {failed
          .map((outcome) => {
            const sourceId = PROVIDER_ID_TO_SOURCE[outcome.providerId];
            return sourceId ? ASSET_SOURCES[sourceId].label : outcome.providerId;
          })
          .join(", ")}{" "}
        {failed.length === 1 ? "is" : "are"} temporarily unavailable — showing results from other sources instead.
      </p>
    </div>
  );
}
