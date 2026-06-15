import { NextResponse } from "next/server";
import { tmdb, tmdbEnabled, isAllowedPath } from "@/lib/tmdb/client";
import { cached } from "@/lib/xtream/cache";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Same-origin proxy for TMDB (key stays server-side, responses cached).
 *   GET /api/tmdb?path=trending/all/week&page=1
 * Returns { _disabled: true } when no TMDB key is configured so the UI can
 * fall back to the provider catalog.
 */
export async function GET(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!tmdbEnabled()) return NextResponse.json({ _disabled: true });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";
  if (!isAllowedPath(path)) return NextResponse.json({ error: "Path not allowed" }, { status: 400 });

  const params: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) if (k !== "path") params[k] = v;

  const key = `tmdb|${path}|${JSON.stringify(params)}`;
  try {
    const data = await cached(key, 15 * 60 * 1000, () => tmdb(path, params));
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
