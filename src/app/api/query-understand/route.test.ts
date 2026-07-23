import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFetchSearchIntentFromGemini, mockIsGeminiConfigured } = vi.hoisted(() => ({
  mockFetchSearchIntentFromGemini: vi.fn(),
  mockIsGeminiConfigured: vi.fn(),
}));

vi.mock("@/lib/gemini/fetch-intent", () => ({
  fetchSearchIntentFromGemini: mockFetchSearchIntentFromGemini,
  isGeminiConfigured: mockIsGeminiConfigured,
}));

import { POST } from "./route";

const VALID_INTENT = {
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

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/query-understand", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/query-understand", () => {
  beforeEach(() => {
    mockFetchSearchIntentFromGemini.mockReset();
    mockIsGeminiConfigured.mockReset();
    mockIsGeminiConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns intent: null with reason 'empty-query' for a blank query, without checking Gemini config", async () => {
    const response = await POST(postRequest({ query: "   " }));
    const body = await response.json();

    expect(body).toEqual({ intent: null, reason: "empty-query" });
    expect(mockIsGeminiConfigured).not.toHaveBeenCalled();
    expect(mockFetchSearchIntentFromGemini).not.toHaveBeenCalled();
  });

  it("returns intent: null with reason 'missing-key' when Gemini isn't configured, without calling fetchSearchIntentFromGemini", async () => {
    mockIsGeminiConfigured.mockReturnValue(false);

    const response = await POST(postRequest({ query: "sword" }));
    const body = await response.json();

    expect(body).toEqual({ intent: null, reason: "missing-key" });
    expect(mockFetchSearchIntentFromGemini).not.toHaveBeenCalled();
  });

  it("returns the intent on success", async () => {
    mockFetchSearchIntentFromGemini.mockResolvedValue({ ok: true, intent: VALID_INTENT });

    const response = await POST(postRequest({ query: `unique-query-${Math.random()}` }));
    const body = await response.json();

    expect(body.intent).toEqual(VALID_INTENT);
    expect(body.reason).toBeUndefined();
  });

  it("propagates the failure reason and never leaks upstream error text", async () => {
    mockFetchSearchIntentFromGemini.mockResolvedValue({ ok: false, reason: "upstream-error" });

    const response = await POST(postRequest({ query: `unique-query-${Math.random()}` }));
    const body = await response.json();

    expect(body).toEqual({ intent: null, reason: "upstream-error" });
  });

  it("caches a successful result and does not call Gemini again for the identical query", async () => {
    const query = `cache-test-${Math.random()}`;
    mockFetchSearchIntentFromGemini.mockResolvedValue({ ok: true, intent: VALID_INTENT });

    await POST(postRequest({ query }));
    await POST(postRequest({ query }));

    expect(mockFetchSearchIntentFromGemini).toHaveBeenCalledTimes(1);
  });

  it("coalesces identical concurrent in-flight requests into a single Gemini call", async () => {
    const query = `inflight-test-${Math.random()}`;
    let resolveGemini!: (value: { ok: true; intent: typeof VALID_INTENT }) => void;
    mockFetchSearchIntentFromGemini.mockReturnValue(
      new Promise((resolve) => {
        resolveGemini = resolve;
      }),
    );

    const first = POST(postRequest({ query }));
    const second = POST(postRequest({ query }));

    resolveGemini({ ok: true, intent: VALID_INTENT });
    const [firstBody, secondBody] = await Promise.all([first.then((r) => r.json()), second.then((r) => r.json())]);

    expect(mockFetchSearchIntentFromGemini).toHaveBeenCalledTimes(1);
    expect(firstBody.intent).toEqual(VALID_INTENT);
    expect(secondBody.intent).toEqual(VALID_INTENT);
  });

  it("never includes GEMINI_API_KEY or any secret-looking value in the response body", async () => {
    process.env.GEMINI_API_KEY = "super-secret-test-key-should-never-leak";
    mockFetchSearchIntentFromGemini.mockResolvedValue({ ok: false, reason: "upstream-error" });

    const response = await POST(postRequest({ query: `secret-test-${Math.random()}` }));
    const rawText = JSON.stringify(await response.json());

    expect(rawText).not.toContain("super-secret-test-key-should-never-leak");
    delete process.env.GEMINI_API_KEY;
  });
});
