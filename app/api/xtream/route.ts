import { NextResponse } from "next/server";
import { dispatch, XtreamError } from "@/lib/xtream/client";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

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
    const data = await dispatch(creds, action, params);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    const status = err instanceof XtreamError && err.status ? err.status : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream error" },
      { status },
    );
  }
}
