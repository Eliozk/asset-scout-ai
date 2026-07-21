"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { AssetFilters } from "@/domain/asset";
import { isFiltersEmpty } from "@/domain/asset";
import { FiltersPanel } from "./FiltersPanel";

interface FilterDrawerProps {
  readonly filters: AssetFilters;
  readonly onChange: (filters: AssetFilters) => void;
}

/**
 * Mobile/tablet filter drawer. Uses the native <dialog> element so focus
 * trapping, Escape-to-close, and backdrop dismissal come from the browser
 * instead of hand-rolled logic.
 */
export function FilterDrawer({ filters, onChange }: FilterDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filters
        {!isFiltersEmpty(filters) && (
          <span className="ml-1 size-1.5 rounded-full bg-accent-cyan" aria-hidden="true" />
        )}
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        aria-label="Filters"
        className="m-0 h-full max-h-full w-full max-w-sm border-none bg-transparent p-0 backdrop:bg-black/60"
      >
        <div className="ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-border-subtle bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Filters</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close filters"
              className="focus-ring rounded-md p-1.5 text-text-muted hover:text-foreground"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <FiltersPanel filters={filters} onChange={onChange} />
        </div>
      </dialog>
    </div>
  );
}
