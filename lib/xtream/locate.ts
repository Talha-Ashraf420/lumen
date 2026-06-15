import { buildStreamUrl } from "./urls";
import { cached } from "./cache";
import type { XtreamCredentials, StreamKind } from "./types";

const UA = "VLC/3.0.20 LibVLC/3.0.20";
// Providers often serve a title under a different container than the catalog claims.
const EXTS = ["mkv", "mp4", "ts", "avi", "m4v"];

export interface Located {
  url: string;
  ext: string;
  contentType: string;
}

function isMedia(ct: string): boolean {
  if (!ct) return true; // some servers omit it on the data stream — assume ok
  return !/text\/html|application\/json|text\/plain/i.test(ct);
}

/**
 * Finds the actually-playable provider URL for a VOD/series title by probing
 * common container extensions (the catalog's extension is often wrong, returning
 * an HTML error page). Result is cached so repeated range requests don't re-probe.
 * Returns null when nothing playable is found (title unavailable).
 */
export async function locatePlayable(
  creds: XtreamCredentials,
  type: StreamKind,
  id: string,
  preferred: string,
): Promise<Located | null> {
  const key = `locate|${creds.username}|${type}|${id}`;
  return cached(key, 30 * 60 * 1000, async () => {
    const order = [preferred, ...EXTS.filter((e) => e !== preferred)];
    for (const ext of order) {
      const url = buildStreamUrl(creds, type, id, ext);
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "User-Agent": UA, Range: "bytes=0-1", Accept: "*/*" },
          redirect: "follow",
          signal: AbortSignal.timeout(4500),
        });
        const ct = res.headers.get("content-type") || "";
        res.body?.cancel().catch(() => {});
        if ((res.ok || res.status === 206) && isMedia(ct)) {
          return { url, ext, contentType: ct };
        }
      } catch {
        // try next extension
      }
    }
    return null;
  });
}
