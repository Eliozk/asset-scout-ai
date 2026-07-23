import { NextRequest, NextResponse } from "next/server";
import { fetchAmbientCGAssets, AmbientCGUpstreamError } from "@/lib/providers/ambientcg/fetch-assets";

/**
 * Server-side proxy for ambientCG's search. The client-side
 * AmbientCGProvider fetches this route (never ambientCG directly) — mirrors
 * the Sketchfab/Pixabay route pattern exactly, even though ambientCG needs
 * no API key at all, for architectural consistency (AGENTS.md: "External
 * providers are called server-side only").
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query === "") {
    return NextResponse.json({ assets: [], totalUpstream: 0, skipped: 0 });
  }

  try {
    const { assets, totalUpstream, skipped } = await fetchAmbientCGAssets(query);
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof AmbientCGUpstreamError ? error.message : "ambientCG is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
