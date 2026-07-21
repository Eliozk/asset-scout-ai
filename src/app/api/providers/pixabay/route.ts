import { NextRequest, NextResponse } from "next/server";
import { fetchPixabayImages, PixabayUpstreamError } from "@/lib/providers/pixabay/fetch-assets";

/**
 * Server-side proxy for Pixabay's public image search. Client code fetches
 * this route (never pixabay.com directly), so PIXABAY_API_KEY stays
 * server-only and never reaches the browser. Unlike Sketchfab's optional
 * token, this key is required — every Pixabay request needs one.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchPixabayImages(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    // PixabayNotConfiguredError's message is safe to expose — it only states
    // configuration status, never the key value or other internals.
    const message = error instanceof PixabayUpstreamError ? error.message : "Pixabay is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
