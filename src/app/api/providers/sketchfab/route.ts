import { NextRequest, NextResponse } from "next/server";
import { fetchSketchfabModels, SketchfabUpstreamError } from "@/lib/providers/sketchfab/fetch-assets";

/**
 * Server-side proxy for Sketchfab's model search. The client-side
 * SketchfabProvider fetches this route (never Sketchfab directly), so any
 * future SKETCHFAB_API_TOKEN stays server-only and never reaches the browser.
 *
 * Unlike Poly Haven (whole catalog fetched once), Sketchfab supports real
 * server-side search — so this route is queried per search text rather than
 * caching one giant catalog.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchSketchfabModels(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof SketchfabUpstreamError ? error.message : "Sketchfab is unavailable right now.";
    // Deliberately generic: never leak internal error details (or the
    // presence/absence of a token) to the client.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
