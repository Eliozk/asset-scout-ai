import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  groq: vi.fn(),
  gemini: vi.fn(),
  groqConfigured: vi.fn(),
  geminiConfigured: vi.fn(),
}));

vi.mock("@/lib/groq/fetch-intent", () => ({
  fetchSearchIntentFromGroq: mocks.groq,
  isGroqConfigured: mocks.groqConfigured,
}));
vi.mock("@/lib/gemini/fetch-intent", () => ({
  fetchSearchIntentFromGemini: mocks.gemini,
  isGeminiConfigured: mocks.geminiConfigured,
}));

import { isQueryUnderstandingConfigured, understandQuery } from "./understand-query";

const INTENT = { normalizedQuery: "sword" };

describe("understandQuery", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.groqConfigured.mockReturnValue(true);
    mocks.geminiConfigured.mockReturnValue(true);
  });

  it("uses Groq first and never calls Gemini when Groq succeeds", async () => {
    mocks.groq.mockResolvedValue({ ok: true, intent: INTENT });
    expect(await understandQuery("sword")).toEqual({ ok: true, intent: INTENT });
    expect(mocks.gemini).not.toHaveBeenCalled();
  });

  it("falls back to Gemini when Groq fails", async () => {
    mocks.groq.mockResolvedValue({ ok: false, reason: "rate-limited" });
    mocks.gemini.mockResolvedValue({ ok: true, intent: INTENT });
    expect(await understandQuery("sword")).toEqual({ ok: true, intent: INTENT });
    expect(mocks.gemini).toHaveBeenCalledWith("sword");
  });

  it("reports Gemini's reason when both fail", async () => {
    mocks.groq.mockResolvedValue({ ok: false, reason: "timeout" });
    mocks.gemini.mockResolvedValue({ ok: false, reason: "upstream-error" });
    expect(await understandQuery("sword")).toEqual({ ok: false, reason: "upstream-error" });
  });

  it("returns Groq's result as-is when Gemini isn't configured", async () => {
    mocks.geminiConfigured.mockReturnValue(false);
    mocks.groq.mockResolvedValue({ ok: false, reason: "timeout" });
    expect(await understandQuery("sword")).toEqual({ ok: false, reason: "timeout" });
    expect(mocks.gemini).not.toHaveBeenCalled();
  });

  it("goes straight to Gemini when Groq isn't configured", async () => {
    mocks.groqConfigured.mockReturnValue(false);
    mocks.gemini.mockResolvedValue({ ok: true, intent: INTENT });
    expect(await understandQuery("sword")).toEqual({ ok: true, intent: INTENT });
    expect(mocks.groq).not.toHaveBeenCalled();
  });
});

describe("isQueryUnderstandingConfigured", () => {
  it("is true when either provider has a key", () => {
    mocks.groqConfigured.mockReturnValue(false);
    mocks.geminiConfigured.mockReturnValue(false);
    expect(isQueryUnderstandingConfigured()).toBe(false);
    mocks.geminiConfigured.mockReturnValue(true);
    expect(isQueryUnderstandingConfigured()).toBe(true);
    mocks.groqConfigured.mockReturnValue(true);
    mocks.geminiConfigured.mockReturnValue(false);
    expect(isQueryUnderstandingConfigured()).toBe(true);
  });
});
