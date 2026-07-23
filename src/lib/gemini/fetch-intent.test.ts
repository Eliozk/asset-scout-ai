import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));

vi.mock("@google/genai", () => {
  class FakeGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI: FakeGoogleGenAI };
});

import { fetchSearchIntentFromGemini, isGeminiConfigured } from "./fetch-intent";

const VALID_RAW_INTENT = {
  normalizedQuery: "medieval sword",
  meaningfulKeywords: ["medieval", "sword"],
  dimension: "3D",
  assetTypes: ["Weapon"],
  engines: ["Unity"],
  styles: ["Realistic"],
  platforms: [],
  freeOnly: null,
  originalLanguage: "en",
  interpretationSummary: "Looking for a medieval sword.",
};

describe("fetchSearchIntentFromGemini", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    mockGenerateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key-not-real";
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  });

  it("never calls the SDK at all when GEMINI_API_KEY is missing (never even attempts a network call)", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "missing-key" });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns the validated intent on a well-formed success response", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RAW_INTENT) });

    const result = await fetchSearchIntentFromGemini("medieval sword");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intent.normalizedQuery).toBe("medieval sword");
    }
  });

  it("falls back with reason 'empty-output' when the SDK returns no text", async () => {
    mockGenerateContent.mockResolvedValue({ text: undefined });
    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "empty-output" });
  });

  it("falls back with reason 'invalid-json' when the SDK returns non-JSON text", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not json at all {{{" });
    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "invalid-json" });
  });

  it("falls back with reason 'schema-invalid' when the JSON doesn't pass validation", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ normalizedQuery: "" }) });
    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "schema-invalid" });
  });

  it("falls back with reason 'timeout' on an AbortSignal timeout, and never retries", async () => {
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    mockGenerateContent.mockRejectedValue(timeoutError);

    const result = await fetchSearchIntentFromGemini("sword");

    expect(result).toEqual({ ok: false, reason: "timeout" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("falls back with reason 'rate-limited' on a 429, and never retries", async () => {
    const rateLimitError = Object.assign(new Error("Resource exhausted"), { status: 429 });
    mockGenerateContent.mockRejectedValue(rateLimitError);

    const result = await fetchSearchIntentFromGemini("sword");

    expect(result).toEqual({ ok: false, reason: "rate-limited" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("falls back with reason 'upstream-error' on another 4xx/5xx status", async () => {
    const serverError = Object.assign(new Error("Internal error"), { status: 500 });
    mockGenerateContent.mockRejectedValue(serverError);

    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "upstream-error" });
  });

  it("falls back with reason 'network-error' on a generic fetch failure", async () => {
    mockGenerateContent.mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await fetchSearchIntentFromGemini("sword");
    expect(result).toEqual({ ok: false, reason: "network-error" });
  });

  it("makes exactly one attempt per call — never retries internally for any failure reason", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Some transient error"));
    await fetchSearchIntentFromGemini("sword");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("uses the default stable model when GEMINI_MODEL is unset", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RAW_INTENT) });
    await fetchSearchIntentFromGemini("sword");
    const [args] = mockGenerateContent.mock.calls[0];
    expect(args.model).toBe("gemini-3.1-flash-lite");
  });

  it("regression: never silently reverts to gemini-2.5-flash-lite, confirmed live (2026-07) to 404 for a new API key/account with 'no longer available to new users'", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RAW_INTENT) });
    await fetchSearchIntentFromGemini("sword");
    const [args] = mockGenerateContent.mock.calls[0];
    expect(args.model).not.toBe("gemini-2.5-flash-lite");
    expect(args.model).not.toBe("gemini-2.5-flash");
  });

  it("uses GEMINI_MODEL when explicitly configured, overriding the default", async () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RAW_INTENT) });
    await fetchSearchIntentFromGemini("sword");
    const [args] = mockGenerateContent.mock.calls[0];
    expect(args.model).toBe("gemini-3.5-flash-lite");
  });

  it("requests structured JSON output via responseMimeType + responseSchema", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RAW_INTENT) });
    await fetchSearchIntentFromGemini("sword");
    const [args] = mockGenerateContent.mock.calls[0];
    expect(args.config.responseMimeType).toBe("application/json");
    expect(args.config.responseSchema).toBeDefined();
  });
});

describe("isGeminiConfigured", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  it("is false when GEMINI_API_KEY is unset", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
  });

  it("is false when GEMINI_API_KEY is blank", () => {
    process.env.GEMINI_API_KEY = "   ";
    expect(isGeminiConfigured()).toBe(false);
  });

  it("is true when GEMINI_API_KEY is set to a real-looking value", () => {
    process.env.GEMINI_API_KEY = "a-real-looking-key";
    expect(isGeminiConfigured()).toBe(true);
  });
});
