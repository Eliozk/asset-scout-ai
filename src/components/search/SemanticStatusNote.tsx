import type { SemanticStatus } from "@/hooks/useSemanticRanking";

const MESSAGES: Readonly<Record<SemanticStatus, string>> = {
  loading: "Loading AI search…",
  ready:
    "Search results are ranked by a small AI model that compares meaning, not just keywords — it runs entirely on your device, not the internet.",
  unavailable: "AI search isn't available on this device or browser right now — showing keyword-ranked results instead.",
};

export function SemanticStatusNote({ status }: { readonly status: SemanticStatus }) {
  return <p className="mx-auto mt-4 max-w-md text-center text-xs text-text-faint">{MESSAGES[status]}</p>;
}
