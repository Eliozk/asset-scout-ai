import type { GeminiIntentResult, GeminiUnavailableReason } from "@/lib/gemini/fetch-intent";
import { SEARCH_INTENT_SYSTEM_INSTRUCTION, buildUserContent } from "@/lib/gemini/prompt";
import { validateSearchIntent } from "@/lib/gemini/validate-intent";
import { GROQ_SEARCH_INTENT_SCHEMA } from "./response-schema";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Free-tier (no card) model with strict json_schema structured-output support
 * on Groq. Configurable via GROQ_MODEL — only switch to another model Groq
 * lists under strict-mode structured outputs.
 */
const DEFAULT_MODEL = "openai/gpt-oss-20b";

/**
 * Shorter than Gemini's budget on purpose: Groq is the fast primary, and a
 * slow or failed Groq call must leave Gemini (the backup) time to answer
 * before the search feels stuck.
 */
const REQUEST_TIMEOUT_MS = 3_000;

export function isGroqConfigured(): boolean {
  return typeof process.env.GROQ_API_KEY === "string" && process.env.GROQ_API_KEY.trim() !== "";
}

function resolveModel(): string {
  const configured = process.env.GROQ_MODEL?.trim();
  return configured && configured !== "" ? configured : DEFAULT_MODEL;
}

/**
 * Single-attempt, server-only Groq call producing the same validated
 * SearchIntent as the Gemini path, with the same closed set of failure
 * reasons. Like the Gemini module, it never retries, never logs, and never
 * surfaces the upstream error body.
 */
export async function fetchSearchIntentFromGroq(rawQuery: string): Promise<GeminiIntentResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return { ok: false, reason: "missing-key" };
  }

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: resolveModel(),
        messages: [
          { role: "system", content: SEARCH_INTENT_SYSTEM_INSTRUCTION },
          { role: "user", content: buildUserContent(rawQuery) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "search_intent", strict: true, schema: GROQ_SEARCH_INTENT_SCHEMA },
        },
        reasoning_effort: "low", // an extraction task — deep reasoning only adds latency
        include_reasoning: false,
        temperature: 0.1,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, reason: classifyFetchError(error) };
  }

  if (response.status === 429) return { ok: false, reason: "rate-limited" };
  if (!response.ok) return { ok: false, reason: "upstream-error" };

  let content: unknown;
  try {
    const body = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    content = body.choices?.[0]?.message?.content;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (typeof content !== "string" || content.trim() === "") {
    return { ok: false, reason: "empty-output" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  const intent = validateSearchIntent(parsedJson);
  if (!intent) {
    return { ok: false, reason: "schema-invalid" };
  }

  return { ok: true, intent };
}

function classifyFetchError(error: unknown): GeminiUnavailableReason {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "timeout";
  }
  if (error instanceof TypeError) {
    return "network-error";
  }
  return "internal-error";
}
