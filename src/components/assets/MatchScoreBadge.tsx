interface MatchScoreBadgeProps {
  readonly score: number;
}

function scoreColorClass(score: number): string {
  if (score >= 85) return "text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10";
  if (score >= 65) return "text-accent-blue border-accent-blue/40 bg-accent-blue/10";
  return "text-text-muted border-border-strong bg-surface-elevated";
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreColorClass(score)}`}
      title="Demonstration AI match score"
    >
      {score}% match
    </span>
  );
}
