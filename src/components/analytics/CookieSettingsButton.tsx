"use client";

import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

/** Footer control that reopens the consent banner, so a choice can be changed at any time. */
export function CookieSettingsButton() {
  const { reset } = useAnalyticsConsent();

  return (
    <button
      type="button"
      onClick={reset}
      className="focus-ring rounded font-medium text-text-muted underline hover:text-foreground"
    >
      Cookie settings
    </button>
  );
}
