/** Public Clarity project ID — it ships in the page's HTML anyway, not a secret. */
export const CLARITY_PROJECT_ID = "z1bnaftdio";

/**
 * The only host Clarity ever records on. Localhost, a local `next start`, a dev
 * tunnel, and Vercel preview URLs never load it, so the owner's own testing
 * doesn't pollute the live stats. Hardcoded rather than derived from SITE_URL:
 * that falls back to localhost when NEXT_PUBLIC_SITE_URL is unset, which would
 * quietly turn this gate inside out.
 */
export const CLARITY_HOSTNAME = "asset-scout-ai.vercel.app";

const CLARITY_SCRIPT_ID = "microsoft-clarity";

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

export function isClarityHost(hostname: string): boolean {
  return hostname === CLARITY_HOSTNAME;
}

export function isClarityLoaded(): boolean {
  return document.getElementById(CLARITY_SCRIPT_ID) !== null;
}

/**
 * The official Clarity bootstrap as DOM calls: a queueing `window.clarity`
 * stub (the real tag replays its queue once it loads), then the async tag
 * itself. Safe to call more than once.
 */
export function loadClarity(): void {
  if (isClarityLoaded()) return;

  if (!window.clarity) {
    const queue: unknown[][] = [];
    const stub: ClarityFn = (...args) => {
      queue.push(args);
    };
    stub.q = queue;
    window.clarity = stub;
  }

  const script = document.createElement("script");
  script.id = CLARITY_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  document.head.appendChild(script);
}

/**
 * Passes the visitor's choice to Clarity (Consent API v2). Ads storage is
 * always denied — AssetScout AI runs no advertising. A revoked consent also
 * erases Clarity's existing cookies, per Microsoft's consent docs.
 */
export function setClarityConsent(granted: boolean): void {
  if (!window.clarity) return;

  window.clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: granted ? "granted" : "denied",
  });
  if (!granted) {
    window.clarity("consent", false);
  }
}
