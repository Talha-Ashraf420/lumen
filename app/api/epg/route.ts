import { NextResponse } from "next/server";
import { getShortEpg, XtreamError } from "@/lib/xtream/client";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

function decodeB64(s: string): string {
  if (!s) return "";
  try {
    return Buffer.from(s, "base64").toString("utf8");
  } catch {
    return s;
  }
}

/**
 * Short EPG for a channel with base64 title/description already decoded.
 *   GET /api/epg?stream_id=123&limit=8
 */
export async function GET(req: Request) {
  let creds;
  try {
    creds = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const streamId = searchParams.get("stream_id");
  if (!streamId) return NextResponse.json({ error: "Missing stream_id" }, { status: 400 });
  const limit = Number(searchParams.get("limit") || 8);

  try {
    const data = await getShortEpg(creds, streamId, limit);
    const listings = (data.epg_listings || []).map((e) => ({
      ...e,
      title: decodeB64(e.title),
      description: decodeB64(e.description),
    }));
    return NextResponse.json({ epg_listings: listings }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    const status = err instanceof XtreamError && err.status ? err.status : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "EPG error" },
      { status },
    );
  }
}
