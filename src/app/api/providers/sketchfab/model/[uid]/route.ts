import { NextRequest, NextResponse } from "next/server";
import { fetchSketchfabModelById, SketchfabUpstreamError } from "@/lib/providers/sketchfab/fetch-assets";

/**
 * Server-side proxy for looking up one Sketchfab model by id. Used to
 * resolve a favorited Sketchfab asset that a text search wouldn't
 * necessarily surface again — Sketchfab has no "browse everything" endpoint,
 * unlike Poly Haven, so this is the only way to recover a single saved item.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  try {
    const asset = await fetchSketchfabModelById(uid);
    if (!asset) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof SketchfabUpstreamError ? error.message : "Sketchfab is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
