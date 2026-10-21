import { afterEach, describe, expect, it, vi } from "vitest";
import { CLARITY_HOSTNAME, isClarityHost, isClarityLoaded, loadClarity, setClarityConsent } from "./clarity";

afterEach(() => {
  document.getElementById("microsoft-clarity")?.remove();
  delete window.clarity;
});

describe("isClarityHost", () => {
  it("accepts only the live host", () => {
    expect(isClarityHost(CLARITY_HOSTNAME)).toBe(true);
    expect(isClarityHost("localhost")).toBe(false);
    expect(isClarityHost("127.0.0.1")).toBe(false);
    expect(isClarityHost("asset-scout-ai-git-feature-eliozk.vercel.app")).toBe(false);
  });
});

describe("loadClarity", () => {
  it("adds the tag once and installs a queueing stub", () => {
    loadClarity();
    loadClarity();

    const scripts = document.querySelectorAll("#microsoft-clarity");
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.getAttribute("src")).toBe("https://www.clarity.ms/tag/z1bnaftdio");
    expect(isClarityLoaded()).toBe(true);

    window.clarity?.("event", "test");
    expect(window.clarity?.q).toEqual([["event", "test"]]);
  });
});

describe("setClarityConsent", () => {
  it("grants analytics storage but never ad storage", () => {
    const clarity = vi.fn();
    window.clarity = clarity;
    setClarityConsent(true);
    expect(clarity).toHaveBeenCalledTimes(1);
    expect(clarity).toHaveBeenCalledWith("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  });

  it("denies and erases cookies when consent is withdrawn", () => {
    const clarity = vi.fn();
    window.clarity = clarity;
    setClarityConsent(false);
    expect(clarity).toHaveBeenCalledWith("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
    expect(clarity).toHaveBeenCalledWith("consent", false);
  });

  it("does nothing when Clarity was never loaded", () => {
    expect(() => setClarityConsent(false)).not.toThrow();
  });
});
