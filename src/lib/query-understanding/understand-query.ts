import { fetchSearchIntentFromGemini, isGeminiConfigured, type GeminiIntentResult } from "@/lib/gemini/fetch-intent";
import { fetchSearchIntentFromGroq, isGroqConfigured } from "@/lib/groq/fetch-intent";

export function isQueryUnderstandingConfigured(): boolean {
  return isGroqConfigured() || isGeminiConfigured();
}

/**
 * Groq (fast, free) first, Gemini as the backup on any Groq failure. Each
 * provider is optional: with only one key configured, only that one is used.
 * When both fail, Gemini's reason is reported, since it was the last attempt.
 */
export async function understandQuery(cleanedQuery: string): Promise<GeminiIntentResult> {
  if (isGroqConfigured()) {
    const groqResult = await fetchSearchIntentFromGroq(cleanedQuery);
    if (groqResult.ok || !isGeminiConfigured()) return groqResult;
  }
  return fetchSearchIntentFromGemini(cleanedQuery);
}
