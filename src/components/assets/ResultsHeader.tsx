import type { SortOption } from "@/domain/asset";
import { PoweredBySources } from "@/components/layout/PoweredBySources";
import { SortSelect } from "./SortSelect";

interface ResultsHeaderProps {
  readonly count: number;
  readonly sort: SortOption;
  readonly onSortChange: (sort: SortOption) => void;
}

export function ResultsHeader({ count, sort, onSortChange }: ResultsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
        <span>
          <span className="font-semibold text-foreground">{count}</span> live{" "}
          {count === 1 ? "result" : "results"}
        </span>
        <PoweredBySources />
      </p>
      <SortSelect value={sort} onChange={onSortChange} />
    </div>
  );
}
