import { NextRequest, NextResponse } from "next/server";
import { fetchOpenverseAssets, OpenverseUpstreamError } from "@/lib/providers/openverse/fetch-assets";

/** Server-side proxy for Openverse search — mirrors the Sketchfab/ambientCG route pattern. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchOpenverseAssets(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof OpenverseUpstreamError ? error.message : "Openverse is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
