import { GoogleGenAI } from "@google/genai";
import type { SearchIntent } from "@/domain/search-intent";
import { GEMINI_SEARCH_INTENT_SCHEMA } from "./response-schema";
import { SEARCH_INTENT_SYSTEM_INSTRUCTION, buildUserContent } from "./prompt";
import { validateSearchIntent } from "./validate-intent";

/**
 * Server-only Gemini query-understanding call. Every failure mode listed in
 * the milestone spec collapses into one of these reasons — callers never see
 * (and this module never logs) the raw upstream error body, which could in
 * principle echo back request details.
 */
export type GeminiUnavailableReason =
  | "missing-key"
  | "timeout"
  | "network-error"
  | "rate-limited"
  | "upstream-error"
  | "invalid-json"
  | "schema-invalid"
  | "empty-output"
  | "internal-error";

export type GeminiIntentResult =
  | { readonly ok: true; readonly intent: SearchIntent }
  | { readonly ok: false; readonly reason: GeminiUnavailableReason };

/** Default: current stable Gemini Developer API model confirmed to support both the free tier and structured JSON output (ai.google.dev/gemini-api/docs/models, ai.google.dev/gemini-api/docs/pricing). Configurable via GEMINI_MODEL. */
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

/** Deliberately short — this sits inside a synchronous search flow; a slow Gemini call must not make the whole page feel broken. */
const REQUEST_TIMEOUT_MS = 6_000;

export function isGeminiConfigured(): boolean {
  return typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim() !== "";
}

function resolveModel(): string {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured && configured !== "" ? configured : DEFAULT_MODEL;
}

/**
 * Single-attempt, server-only call to the Gemini Developer API. Never
 * retries (including on 429 — see AGENTS.md-equivalent rule in the milestone
 * spec: "never automatically retry a 429"), never falls back to a paid
 * model, and aborts itself after REQUEST_TIMEOUT_MS via AbortSignal (the
 * SDK's own httpOptions.timeout is not reliably honored by the current
 * generateContent implementation, so AbortSignal is the mechanism that
 * actually works — see googleapis/js-genai#1277).
 *
 * `rawQuery` must already be trimmed/length-capped by the caller
 * (validate-intent.ts's prepareRawQueryForGemini) — this module does not
 * re-clamp it, to keep the one length limit in one place.
 */
export async function fetchSearchIntentFromGemini(rawQuery: string): Promise<GeminiIntentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return { ok: false, reason: "missing-key" };
  }

  const client = new GoogleGenAI({ apiKey });
  const model = resolveModel();

  let responseText: string | undefined;
  try {
    const response = await client.models.generateContent({
      model,
      contents: buildUserContent(rawQuery),
      config: {
        systemInstruction: SEARCH_INTENT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: GEMINI_SEARCH_INTENT_SCHEMA,
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        temperature: 0.1, // low — this is an extraction/classification task, not creative writing
      },
    });
    responseText = response.text;
  } catch (error) {
    return { ok: false, reason: classifyGeminiError(error) };
  }

  if (!responseText || responseText.trim() === "") {
    return { ok: false, reason: "empty-output" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  const intent = validateSearchIntent(parsedJson);
  if (!intent) {
    return { ok: false, reason: "schema-invalid" };
  }

  return { ok: true, intent };
}

/**
 * Maps whatever the SDK throws into one of our closed set of reasons.
 * Deliberately conservative about reading error internals — only the HTTP
 * status code / a couple of well-known error-name markers are inspected,
 * never the error message body (which could echo request content).
 */
function classifyGeminiError(error: unknown): GeminiUnavailableReason {
  if (error instanceof Error && error.name === "TimeoutError") {
    return "timeout";
  }

  const status = extractStatusCode(error);
  if (status === 429) return "rate-limited";
  if (status !== null && status >= 400 && status < 600) return "upstream-error";

  if (error instanceof TypeError) {
    // fetch's generic "failed to fetch" / DNS / connection-refused shape
    return "network-error";
  }

  return "internal-error";
}

function extractStatusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; code?: unknown };
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.code === "number") return candidate.code;
  return null;
}
