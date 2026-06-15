import { requireSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/xtream/urls";
import { locatePlayable } from "@/lib/xtream/locate";
import type { StreamKind } from "@/lib/xtream/types";

export const runtime = "nodejs";
// Streaming responses must not be statically optimized / buffered.
export const dynamic = "force-dynamic";

const UA = "VLC/3.0.20 LibVLC/3.0.20"; // many providers gate on a player-like UA

/**
 * Media proxy. Builds the real provider URL from the session creds and pipes
 * bytes back to the browser, forwarding Range requests so VOD seeking works.
 *   /api/stream?type=movie&id=123&ext=mp4
 *   /api/stream?type=live&id=456&ext=ts
 */
export async function GET(req: Request) {
  let creds;
  try {
    creds = await requireSession();
  } catch {
    return new Response("Not authenticated", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as StreamKind | null;
  const id = searchParams.get("id");
  const ext = searchParams.get("ext") || "ts";

  if (!type || !id || !["live", "movie", "series"].includes(type)) {
    return new Response("Bad stream request", { status: 400 });
  }

  // For VOD/series the catalog's extension is often wrong (provider returns an
  // HTML error page). Find the real container; bail clearly if none is playable.
  let upstreamUrl = buildStreamUrl(creds, type, id, ext);
  if (type !== "live") {
    const located = await locatePlayable(creds, type, id, ext);
    if (!located) {
      console.log(`[STREAM] ${type}/${id} UNAVAILABLE (no playable container)`);
      return new Response("Title unavailable from provider", {
        status: 404,
        headers: { "x-lumen-unavailable": "1" },
      });
    }
    upstreamUrl = located.url;
  }

  const headers: Record<string, string> = { "User-Agent": UA, Accept: "*/*" };
  const range = req.headers.get("range");
  if (range) headers["Range"] = range;

  const t0 = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers,
      redirect: "follow",
      // @ts-expect-error - undici option, allows half-duplex streaming
      duplex: "half",
      signal: req.signal,
    });
  } catch (err) {
    console.log(`[STREAM] ${type}/${id} PROXY upstream FETCH FAILED after ${Date.now() - t0}ms: ${(err as Error).message}`);
    return new Response(`Upstream fetch failed: ${(err as Error).message}`, { status: 502 });
  }
  console.log(
    `[STREAM] ${type}/${id} PROXY status=${upstream.status} ttfb=${Date.now() - t0}ms range=${range || "none"} ct=${upstream.headers.get("content-type") || "?"}`,
  );

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream returned ${upstream.status}`, { status: upstream.status });
  }

  const respHeaders = new Headers();
  const passthrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "content-disposition",
  ];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) respHeaders.set(h, v);
  }
  if (!respHeaders.has("content-type")) {
    respHeaders.set("content-type", type === "live" ? "video/mp2t" : "video/mp4");
  }
  if (!respHeaders.has("accept-ranges") && type !== "live") {
    respHeaders.set("accept-ranges", "bytes");
  }
  respHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
}
