import type { SortOption } from "@/domain/asset";
import { SortSelect } from "./SortSelect";

interface ResultsHeaderProps {
  readonly count: number;
  readonly sort: SortOption;
  readonly onSortChange: (sort: SortOption) => void;
}

export function ResultsHeader({ count, sort, onSortChange }: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-text-muted">
        <span className="font-semibold text-foreground">{count}</span> {count === 1 ? "result" : "results"}
        <span className="ml-1.5 text-text-faint">(demonstration data)</span>
      </p>
      <SortSelect value={sort} onChange={onSortChange} />
    </div>
  );
}
