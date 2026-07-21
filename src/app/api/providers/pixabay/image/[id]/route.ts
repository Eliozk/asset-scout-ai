import { NextRequest, NextResponse } from "next/server";
import { fetchPixabayImageById, PixabayUpstreamError } from "@/lib/providers/pixabay/fetch-assets";

/**
 * Server-side proxy for looking up one Pixabay image by id (documented `id`
 * parameter). Used to resolve a favorited Pixabay image with a freshly
 * fetched preview URL each time it's displayed, rather than storing one —
 * Pixabay's terms permit temporarily displaying returned URLs in search
 * results but prohibit permanent hotlinking, so every display (including a
 * Favorites-page revisit) is a fresh, live lookup.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const asset = await fetchPixabayImageById(id);
    if (!asset) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof PixabayUpstreamError ? error.message : "Pixabay is unavailable right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
