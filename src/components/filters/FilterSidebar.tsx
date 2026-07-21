import type { AssetFilters } from "@/domain/asset";
import { FiltersPanel } from "./FiltersPanel";

interface FilterSidebarProps {
  readonly filters: AssetFilters;
  readonly onChange: (filters: AssetFilters) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
      <div className="sticky top-24 rounded-xl border border-border-subtle bg-surface-elevated p-5">
        <FiltersPanel filters={filters} onChange={onChange} />
      </div>
    </aside>
  );
}
