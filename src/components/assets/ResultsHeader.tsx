import Link from "next/link";
import type { SortOption } from "@/domain/asset";
import { PoweredBySources } from "@/components/layout/PoweredBySources";
import { SortSelect } from "./SortSelect";

interface ResultsHeaderProps {
  readonly count: number;
  readonly sort: SortOption;
  readonly onSortChange: (sort: SortOption) => void;
  /**
   * True while the AI ranking mode is active (see useSemanticRanking):
   * `count` is then the FULL catalog re-sorted by relevance, not a filtered
   * match count (a natural-language sentence would otherwise zero out under
   * the strict keyword AND-filter) — the label must say so instead of
   * implying every item is a genuine match.
   */
  readonly aiRanked?: boolean;
}

export function ResultsHeader({ count, sort, onSortChange, aiRanked = false }: ResultsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
          {aiRanked ? (
            <span>
              <span className="font-semibold text-foreground">{count}</span> catalog items, ranked by AI
              relevance
            </span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">{count}</span> live{" "}
              {count === 1 ? "result" : "results"}
            </span>
          )}
          <PoweredBySources />
        </p>
        <p className="text-xs text-text-faint">
          Only these 4 sources are searched inside AssetScout. The marketplaces further down the page are
          outbound links only — see{" "}
          <Link href="/sources" className="focus-ring rounded underline hover:text-text-muted">
            Sources
          </Link>{" "}
          for what &quot;live&quot; means for each one.
        </p>
      </div>
      <SortSelect value={sort} onChange={onSortChange} />
    </div>
  );
}
