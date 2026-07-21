import { NextResponse } from "next/server";
import { fetchPolyHavenCatalog, PolyHavenUpstreamError } from "@/lib/providers/polyhaven/fetch-assets";

/**
 * Server-side proxy for Poly Haven's asset catalog. The client-side
 * PolyHavenProvider fetches this route (never Poly Haven directly), so the
 * required User-Agent header and upstream error handling stay server-only.
 * Poly Haven's own /assets response has no search/pagination, so we fetch
 * the whole catalog here (cached ~6h) and let the client's existing pure
 * filter/sort functions do the rest.
 */
export async function GET() {
  try {
    const { assets, totalUpstream, skipped } = await fetchPolyHavenCatalog();
    return NextResponse.json({ assets, totalUpstream, skipped });
  } catch (error) {
    const message = error instanceof PolyHavenUpstreamError ? error.message : "Poly Haven is unavailable right now.";
    // Deliberately generic: never leak internal error details to the client.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
