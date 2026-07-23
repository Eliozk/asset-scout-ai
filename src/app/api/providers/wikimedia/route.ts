import { NextRequest, NextResponse } from "next/server";
import { fetchWikimediaAssets, WikimediaUpstreamError } from "@/lib/providers/wikimedia/fetch-assets";

/** Server-side proxy for Wikimedia Commons search — mirrors the Sketchfab/ambientCG route pattern. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchWikimediaAssets(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof WikimediaUpstreamError ? error.message : "Wikimedia Commons is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
