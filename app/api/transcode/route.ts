import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { requireSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/xtream/urls";
import type { StreamKind } from "@/lib/xtream/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "VLC/3.0.20 LibVLC/3.0.20";
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

/**
 * On-the-fly remux for browser-unplayable containers (MKV/AVI/…).
 * Copies the video stream (no re-encode → cheap, fast) and transcodes audio to
 * AAC, wrapping in fragmented MP4 that plays via a native <video>. Used as a
 * fallback only when direct/proxy playback fails (see watch page source chain).
 *   /api/transcode?type=movie&id=123&ext=mkv
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
  const ext = searchParams.get("ext") || "mkv";
  if (!type || !id) return new Response("Bad request", { status: 400 });

  const input = buildStreamUrl(creds, type, id, ext);

  const args = [
    "-hide_banner",
    "-loglevel", "error",
    "-user_agent", UA,
    "-i", input,
    "-c:v", "copy", // remux video (no re-encode) — fast, low CPU
    "-c:a", "aac", // normalize audio to a browser-friendly codec
    "-ac", "2",
    "-movflags", "frag_keyframe+empty_moov+default_base_moof",
    "-f", "mp4",
    "pipe:1",
  ];

  console.log(`[TRANSCODE] ${type}/${id} ext=${ext} — remuxing via ffmpeg`);
  const ff = spawn(FFMPEG, args, { stdio: ["ignore", "pipe", "pipe"] });

  ff.stderr.on("data", (d) => {
    const s = String(d).trim();
    if (s) console.log(`[TRANSCODE] ${type}/${id} ffmpeg: ${s}`);
  });
  ff.on("error", (e) => console.log(`[TRANSCODE] ${type}/${id} spawn error: ${e.message}`));

  const kill = () => {
    if (!ff.killed) ff.kill("SIGKILL");
  };
  req.signal.addEventListener("abort", kill);
  ff.on("close", () => req.signal.removeEventListener("abort", kill));

  const stream = Readable.toWeb(ff.stdout) as unknown as ReadableStream;

  return new Response(stream, {
    headers: {
      "content-type": "video/mp4",
      "cache-control": "no-store",
    },
  });
}
