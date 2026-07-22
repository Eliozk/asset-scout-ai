/**
 * Single source of truth for the site's public base URL — used by
 * metadataBase (canonical/OG URL resolution), sitemap.ts, and robots.ts.
 *
 * NEXT_PUBLIC_SITE_URL is intentionally unset for local dev (falls back to
 * localhost) and does not need to be a secret — it's just this app's own
 * public URL. Set it in Vercel once the production URL is known (see
 * README's "Vercel environment variables" section); nothing here assumes or
 * hardcodes a specific deployment domain ahead of time.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "AssetScout AI";

export const SITE_DESCRIPTION =
  "Describe a 2D or 3D game asset in plain language and find it across live, integrated sources — with " +
  "on-device semantic ranking and zero cloud AI cost.";
