import type { QueryUnderstandingStatus } from "@/hooks/useQueryUnderstanding";

/**
 * A deliberately separate, compact status note from SemanticStatusNote —
 * Gemini query INTERPRETATION and on-device semantic RANKING are two
 * different concepts (see AGENTS.md / milestone spec: "Provider retrieval
 * and Gemini interpretation must be labeled as separate concepts") and must
 * never be conflated in the UI. Idle/understood-but-settled states render
 * nothing, so this never adds permanent visual noise once a search resolves.
 */
const MESSAGES: Partial<Record<QueryUnderstandingStatus, string>> = {
  understanding: "Understanding your request with Gemini…",
  understood: "Gemini interpreted this query — results below use its English rewrite.",
  unavailable:
    "Gemini interpretation isn't available right now — searching with your original text instead.",
  cooldown: "Please wait a moment before searching again.",
};

export function GeminiStatusNote({ status }: { readonly status: QueryUnderstandingStatus }) {
  const message = MESSAGES[status];
  if (!message) return null;
  return (
    <p role="status" aria-live="polite" className="mx-auto mt-2 max-w-md text-center text-xs text-text-faint">
      {message}
    </p>
  );
}
