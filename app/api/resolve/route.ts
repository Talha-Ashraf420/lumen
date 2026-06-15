import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/xtream/urls";
import type { StreamKind } from "@/lib/xtream/types";

export const runtime = "nodejs";

/**
 * Returns the real provider media URL so the browser can play VOD *directly*
 * (native <video> bypasses CORS for media files — far faster than proxying
 * every byte through Node). Used for movies/series; live still uses /api/stream.
 *   GET /api/resolve?type=movie&id=123&ext=mp4  ->  { url }
 */
export async function GET(req: Request) {
  let creds;
  try {
    creds = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as StreamKind | null;
  const id = searchParams.get("id");
  const ext = searchParams.get("ext") || "mp4";

  if (!type || !id || !["live", "movie", "series"].includes(type)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  return NextResponse.json({ url: buildStreamUrl(creds, type, id, ext) });
}
