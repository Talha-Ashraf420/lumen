import { requireSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/xtream/urls";
import { putUrl, getUrl } from "@/lib/hls/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "VLC/3.0.20 LibVLC/3.0.20";

/**
 * HLS playlist proxy for smooth live TV. Fetches the provider's .m3u8 and
 * rewrites every segment / sub-playlist / key URL to flow back through our proxy
 * (so hls.js avoids CORS and the provider creds stay server-side, behind tokens).
 *   /api/hls?id=<liveStreamId>   (entry — builds the live .m3u8 URL)
 *   /api/hls?t=<token>           (nested variant playlist)
 */
export async function GET(req: Request) {
  let creds;
  try {
    creds = await requireSession();
  } catch {
    return new Response("Not authenticated", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("t");
  const id = searchParams.get("id");

  const playlistUrl = token ? getUrl(token) : id ? buildStreamUrl(creds, "live", id, "m3u8") : null;
  if (!playlistUrl) return new Response("Bad HLS request", { status: 400 });

  let res: Response;
  try {
    res = await fetch(playlistUrl, {
      headers: { "User-Agent": UA, Accept: "application/vnd.apple.mpegurl,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (e) {
    return new Response(`HLS upstream failed: ${(e as Error).message}`, { status: 502 });
  }
  if (!res.ok) return new Response(`HLS upstream ${res.status}`, { status: res.status });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  // If it isn't actually a playlist, bail so the player falls back to TS.
  if (!text.includes("#EXTM3U") && !/mpegurl/i.test(ct)) {
    return new Response("Not an HLS playlist", { status: 415 });
  }

  const finalUrl = res.url || playlistUrl; // honor redirects for relative resolution
  const rewritten = rewritePlaylist(text, finalUrl);

  return new Response(rewritten, {
    headers: {
      "content-type": "application/vnd.apple.mpegurl",
      "cache-control": "no-store",
    },
  });
}

function rewritePlaylist(text: string, playlistUrl: string): string {
  const base = new URL(playlistUrl);
  const resolve = (u: string) => {
    try {
      return new URL(u, base).toString();
    } catch {
      return u;
    }
  };

  return text
    .split("\n")
    .map((line) => {
      const l = line.trim();
      if (!l) return line;
      if (l.startsWith("#")) {
        // rewrite URI="..." in tags like EXT-X-KEY / EXT-X-MEDIA / EXT-X-MAP
        return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="/api/hlsseg?t=${putUrl(resolve(u))}"`);
      }
      const abs = resolve(l);
      // a sub/variant playlist routes back through /api/hls; everything else is a segment
      if (/\.m3u8(\?|$)/i.test(l)) return `/api/hls?t=${putUrl(abs)}`;
      return `/api/hlsseg?t=${putUrl(abs)}`;
    })
    .join("\n");
}
