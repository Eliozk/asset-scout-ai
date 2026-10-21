"use client";

import Link from "next/link";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

const BUTTON_CLASS =
  "focus-ring rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background";

/**
 * Asks before any analytics cookie is set. Accept and Decline get identical
 * styling on purpose — refusing must be as easy as agreeing. Non-modal, so it
 * never blocks reading or searching.
 */
export function ConsentBanner() {
  const { consent, accept, decline } = useAnalyticsConsent();

  if (consent !== "unset") return null;

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-surface shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-text-muted">
          We use analytics cookies.{" "}
          <Link href="/legal" className="focus-ring rounded font-medium text-accent-cyan underline hover:text-foreground">
            Privacy &amp; Terms
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={decline} className={BUTTON_CLASS}>
            Decline
          </button>
          <button type="button" onClick={accept} className={BUTTON_CLASS}>
            Accept
          </button>
        </div>
      </div>
    </section>
  );
}
