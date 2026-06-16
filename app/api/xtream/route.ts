import { NextResponse } from "next/server";
import { dispatch, XtreamError } from "@/lib/xtream/client";
import { requireSession } from "@/lib/session";
import { cached } from "@/lib/xtream/cache";

export const runtime = "nodejs";

// Per-action cache TTLs (ms). Catalogs change rarely; EPG is more volatile.
const HOUR = 60 * 60 * 1000;
// Catalogs change rarely; cache long + persist to disk so cold loads are paid once.
const TTL: Record<string, number> = {
  get_vod_streams: 3 * HOUR,
  get_series: 3 * HOUR,
  get_live_streams: 2 * HOUR,
  get_vod_categories: 12 * HOUR,
  get_series_categories: 12 * HOUR,
  get_live_categories: 12 * HOUR,
  get_vod_info: 6 * HOUR,
  get_series_info: 6 * HOUR,
};

/**
 * Generic same-origin proxy for player_api.php actions.
 *   GET /api/xtream?action=get_live_streams&category_id=5
 * Credentials are pulled from the httpOnly session cookie — never from the client.
 */
export async function GET(req: Request) {
  let creds;
  try {
    creds = await requireSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  const params: Record<string, string | undefined> = {};
  for (const [k, v] of searchParams.entries()) {
    if (k !== "action") params[k] = v;
  }

  try {
    const ttl = TTL[action] ?? 60 * 1000;
    const key = `${creds.username}|${action}|${JSON.stringify(params)}`;
    const data = await cached(key, ttl, () => dispatch(creds, action, params));
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    const status = err instanceof XtreamError && err.status ? err.status : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream error" },
      { status },
    );
  }
}
