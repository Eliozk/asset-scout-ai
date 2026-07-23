import { ASSET_SOURCES } from "@/domain/asset";
import { AUTHORIZED_INDEXED_CATALOG_SOURCES, LIVE_API_SOURCES } from "@/lib/sources/integrated-sources";

// Derived from the same registries /sources renders from — never a separately
// maintained list, so it can't silently drift out of sync as sources are added.
const LIVE_SOURCE_IDS = [...LIVE_API_SOURCES, ...AUTHORIZED_INDEXED_CATALOG_SOURCES].map((source) => source.id);

/**
 * Aggregate attribution for the currently-integrated live sources. Per-asset
 * cards already show that specific asset's real source, license, creator,
 * and original link — this is just the page-level "who provides this data"
 * credit, so it must list every live source rather than naming only one
 * (license also isn't summarized here since it varies per asset/source).
 */
export function PoweredBySources() {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-faint">
      <span>Powered by</span>
      {LIVE_SOURCE_IDS.map((id, index) => {
        const source = ASSET_SOURCES[id];
        return (
          <span key={id} className="flex items-center gap-2">
            <a
              href={source.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded font-medium text-foreground hover:text-accent-cyan"
            >
              {source.label}
            </a>
            {index < LIVE_SOURCE_IDS.length - 1 && <span aria-hidden="true">·</span>}
          </span>
        );
      })}
    </span>
  );
}
