import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

/**
 * Favorites is deliberately excluded — its content is per-visitor
 * localStorage state, nothing there is useful for a search engine to index
 * (see favorites/page.tsx's robots: { index: false }).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sources`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}
