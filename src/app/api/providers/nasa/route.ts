import { NextRequest, NextResponse } from "next/server";
import { fetchNasaAssets, NasaUpstreamError } from "@/lib/providers/nasa/fetch-assets";

/** Server-side proxy for NASA's Image and Video Library search — mirrors the Sketchfab/ambientCG route pattern. */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchNasaAssets(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof NasaUpstreamError ? error.message : "NASA Image Library is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
