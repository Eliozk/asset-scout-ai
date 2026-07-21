import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  readonly message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-16 text-center"
    >
      <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-text-muted">{message}</p>
      </div>
    </div>
  );
}
