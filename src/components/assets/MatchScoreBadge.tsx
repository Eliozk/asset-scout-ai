export type MatchScoreMode = "ai" | "keyword";

interface MatchScoreBadgeProps {
  readonly score: number;
  readonly mode: MatchScoreMode;
}

function scoreColorClass(score: number): string {
  if (score >= 85) return "text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10";
  if (score >= 65) return "text-accent-blue border-accent-blue/40 bg-accent-blue/10";
  return "text-text-muted border-border-strong bg-surface-elevated";
}

export function MatchScoreBadge({ score, mode }: MatchScoreBadgeProps) {
  const label = mode === "ai" ? "AI Match" : "keyword relevance";
  const title =
    mode === "ai"
      ? "Computed locally, on your device, by comparing your search to this asset's description — not a live internet search."
      : "Deterministic relevance score based on keyword/tag/category overlap — not an AI judgment.";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreColorClass(score)}`}
      title={title}
    >
      {score}% {label}
    </span>
  );
}
