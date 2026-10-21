"use client";

import { useEffect } from "react";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";
import { isClarityHost, isClarityLoaded, loadClarity, setClarityConsent } from "@/lib/analytics/clarity";

/**
 * Loads Microsoft Clarity only after the visitor accepts analytics cookies,
 * and only in a production build on the live host. Declining after an earlier
 * accept erases Clarity's cookies and reloads, so the tag is gone for good.
 */
export function ClarityAnalytics() {
  const { consent } = useAnalyticsConsent();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !isClarityHost(window.location.hostname)) return;

    if (consent === "granted") {
      loadClarity();
      setClarityConsent(true);
    } else if (consent === "denied" && isClarityLoaded()) {
      setClarityConsent(false);
      window.location.reload();
    }
  }, [consent]);

  return null;
}
