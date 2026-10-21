import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "@/hooks/useAnalyticsConsent";
import { ConsentBanner } from "./ConsentBanner";
import { CookieSettingsButton } from "./CookieSettingsButton";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("ConsentBanner", () => {
  it("asks when no choice has been made", () => {
    render(<ConsentBanner />);
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeTruthy();
  });

  it.each([
    ["Accept", "granted"],
    ["Decline", "denied"],
  ])("stores %s and hides itself", (label, stored) => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(JSON.stringify(stored));
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  });

  it("stays hidden for a visitor who already chose", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, JSON.stringify("denied"));
    render(<ConsentBanner />);
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  });

  it("comes back when Cookie settings is pressed", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, JSON.stringify("granted"));
    render(
      <>
        <ConsentBanner />
        <CookieSettingsButton />
      </>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    });
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeTruthy();
  });
});
