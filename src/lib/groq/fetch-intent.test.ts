import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSearchIntentFromGroq, isGroqConfigured } from "./fetch-intent";

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

function groqResponse(content: unknown, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
}

describe("fetchSearchIntentFromGroq", () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.GROQ_API_KEY = "test-groq-key-not-real";
    delete process.env.GROQ_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
  });

  it("never calls the network when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    expect(await fetchSearchIntentFromGroq("sword")).toEqual({ ok: false, reason: "missing-key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the validated intent on a well-formed response", async () => {
    fetchMock.mockResolvedValue(groqResponse(JSON.stringify(VALID_RAW_INTENT)));
    const result = await fetchSearchIntentFromGroq("medieval sword");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.intent.normalizedQuery).toBe("medieval sword");
  });

  it("sends a strict json_schema request with low reasoning effort to the default model", async () => {
    fetchMock.mockResolvedValue(groqResponse(JSON.stringify(VALID_RAW_INTENT)));
    await fetchSearchIntentFromGroq("sword");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-groq-key-not-real");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("openai/gpt-oss-20b");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(body.reasoning_effort).toBe("low");
    expect(body.include_reasoning).toBe(false);
  });

  it("uses GROQ_MODEL when configured", async () => {
    process.env.GROQ_MODEL = "openai/gpt-oss-120b";
    fetchMock.mockResolvedValue(groqResponse(JSON.stringify(VALID_RAW_INTENT)));
    await fetchSearchIntentFromGroq("sword");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("openai/gpt-oss-120b");
  });

  it.each([
    [429, "rate-limited"],
    [500, "upstream-error"],
    [400, "upstream-error"],
  ] as const)("maps HTTP %i to '%s'", async (status, reason) => {
    fetchMock.mockResolvedValue(new Response("{}", { status }));
    expect(await fetchSearchIntentFromGroq("sword")).toEqual({ ok: false, reason });
  });

  it("maps a timeout to 'timeout' and a network failure to 'network-error'", async () => {
    const timeoutError = new Error("aborted");
    timeoutError.name = "TimeoutError";
    fetchMock.mockRejectedValueOnce(timeoutError).mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await fetchSearchIntentFromGroq("sword")).toEqual({ ok: false, reason: "timeout" });
    expect(await fetchSearchIntentFromGroq("sword")).toEqual({ ok: false, reason: "network-error" });
  });

  it.each([
    ["no content", null, "empty-output"],
    ["non-JSON content", "not json {{", "invalid-json"],
    ["schema-invalid content", JSON.stringify({ normalizedQuery: "" }), "schema-invalid"],
  ] as const)("rejects %s", async (_label, content, reason) => {
    fetchMock.mockResolvedValue(groqResponse(content));
    expect(await fetchSearchIntentFromGroq("sword")).toEqual({ ok: false, reason });
  });
});

describe("isGroqConfigured", () => {
  const originalKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  });

  it("is false when unset or blank, true when set", () => {
    delete process.env.GROQ_API_KEY;
    expect(isGroqConfigured()).toBe(false);
    process.env.GROQ_API_KEY = "  ";
    expect(isGroqConfigured()).toBe(false);
    process.env.GROQ_API_KEY = "gsk_real_looking";
    expect(isGroqConfigured()).toBe(true);
  });
});
