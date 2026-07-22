import { Languages } from "lucide-react";

/**
 * Shown whenever the active query contains a script this app can't search
 * meaningfully (see lib/search/query-language.ts) — even when a handful of
 * results still come back (e.g. an unrelated homograph match), so the count
 * is never mistaken for genuine relevance.
 */
export function LanguageLimitationNotice() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-border-strong bg-surface-elevated px-3.5 py-2.5 text-xs text-text-muted">
      <Languages size={14} className="mt-0.5 shrink-0 text-text-faint" aria-hidden="true" />
      <p>
        AssetScout&apos;s catalog text and search only understand English right now. Any results shown for this
        query are unreliable — try describing the asset in English instead.
      </p>
    </div>
  );
}
