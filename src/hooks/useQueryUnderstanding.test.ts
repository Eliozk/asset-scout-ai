import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useQueryUnderstanding } from "./useQueryUnderstanding";

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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("useQueryUnderstanding", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("starts idle and returns null for a blank submit without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useQueryUnderstanding());
    expect(result.current.status).toBe("idle");

    let returned: unknown;
    await act(async () => {
      returned = await result.current.submit("   ");
    });

    expect(returned).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to /api/query-understand and reaches status 'understood' on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ intent: VALID_INTENT })));

    const { result } = renderHook(() => useQueryUnderstanding());

    await act(async () => {
      await result.current.submit("medieval sword");
    });

    await waitFor(() => expect(result.current.status).toBe("understood"));
    expect(result.current.intent).toEqual(VALID_INTENT);
  });

  it("reaches status 'unavailable' when the route returns no intent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ intent: null, reason: "missing-key" })));

    const { result } = renderHook(() => useQueryUnderstanding());

    await act(async () => {
      await result.current.submit("sword");
    });

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.intent).toBeNull();
  });

  it("reaches status 'unavailable' on a network failure, never throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { result } = renderHook(() => useQueryUnderstanding());

    await act(async () => {
      await result.current.submit("sword");
    });

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
  });

  it("makes exactly one fetch call per submit()", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ intent: VALID_INTENT }));
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useQueryUnderstanding());
    await act(async () => {
      await result.current.submit("sword");
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("enforces a client-side cooldown between rapid submits, without calling fetch again", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(jsonResponse({ intent: VALID_INTENT }));
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useQueryUnderstanding());

    await act(async () => {
      await result.current.submit("sword");
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.submit("sword again");
    });

    // Cooldown blocks the immediate second submit — still only 1 real fetch.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("cooldown");
  });
});
