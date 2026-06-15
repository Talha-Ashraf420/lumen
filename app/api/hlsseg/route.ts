import { requireSession } from "@/lib/session";
import { getUrl } from "@/lib/hls/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "VLC/3.0.20 LibVLC/3.0.20";

/** Proxies an HLS segment / key by opaque token (real URL kept server-side). */
export async function GET(req: Request) {
  try {
    await requireSession();
  } catch {
    return new Response("Not authenticated", { status: 401 });
  }

  const token = new URL(req.url).searchParams.get("t");
  const target = token ? getUrl(token) : null;
  if (!target) return new Response("Bad segment request", { status: 400 });

  const headers: Record<string, string> = { "User-Agent": UA, Accept: "*/*" };
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(target, { headers, redirect: "follow", signal: req.signal });
  } catch (e) {
    return new Response(`Segment fetch failed: ${(e as Error).message}`, { status: 502 });
  }
  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Segment upstream ${upstream.status}`, { status: upstream.status });
  }

  const respHeaders = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) respHeaders.set(h, v);
  }
  if (!respHeaders.has("content-type")) respHeaders.set("content-type", "video/mp2t");
  respHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}
