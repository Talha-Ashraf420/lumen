import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/xtream/urls";
import type { StreamKind } from "@/lib/xtream/types";

export const runtime = "nodejs";

// A browser-like UA — we want to know how the provider responds to a *browser*,
// since direct play is browser→provider.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PROBE_TIMEOUT = 3500;

/**
 * Returns the direct provider URL + whether direct browser playback looks viable.
 * Probes a tiny range request so the player can choose direct (fast) vs proxy
 * (reliable) without first stalling on a provider that blocks browsers.
 *   GET /api/resolve?type=movie&id=123&ext=mp4  ->  { url, directOk }
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

  const url = buildStreamUrl(creds, type, id, ext);

  let directOk = false;
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": BROWSER_UA, Range: "bytes=0-1", Accept: "*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    directOk = res.ok || res.status === 206;
    console.log(`[RESOLVE] ${type}/${id} directOk=${directOk} status=${res.status} probe=${Date.now() - t0}ms`);
    res.body?.cancel().catch(() => {});
  } catch (e) {
    console.log(`[RESOLVE] ${type}/${id} directOk=false probe=${Date.now() - t0}ms (${(e as Error).name})`);
  } finally {
    clearTimeout(timer);
  }

  return NextResponse.json({ url, directOk });
}
