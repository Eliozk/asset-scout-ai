import { SearchX } from "lucide-react";

interface EmptyStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}

export function EmptyState({
  title = "No matching assets",
  description = "Try a broader search term or clearing some filters.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-elevated px-6 py-16 text-center">
      <SearchX size={32} className="text-text-faint" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
