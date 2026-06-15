// Picks the right playback strategy for a stream and wires it to a <video>.
// Live/TS → mpegts.js · HLS (.m3u8) → hls.js · mp4 → native · mkv/other → native (may fail).

export type EngineKind = "mpegts" | "hls" | "native" | "unsupported";

export interface EngineHandle {
  kind: EngineKind;
  destroy: () => void;
}

const NATIVE_OK = ["mp4", "m4v", "mov", "webm", "ogg"];
const RISKY = ["mkv", "avi", "wmv", "flv", "ts"]; // browser-native support is unreliable

export function pickEngine(ext: string, isLive: boolean): EngineKind {
  const e = ext.toLowerCase().replace(/^\./, "");
  if (e === "m3u8") return "hls";
  if (isLive || e === "ts") return "mpegts";
  if (NATIVE_OK.includes(e)) return "native";
  if (RISKY.includes(e)) return "native"; // attempt; onError surfaces a fallback
  return "native";
}

export async function attach(
  video: HTMLVideoElement,
  opts: { url: string; ext: string; isLive: boolean },
): Promise<EngineHandle> {
  const kind = pickEngine(opts.ext, opts.isLive);

  if (kind === "hls") {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = opts.url; // Safari native HLS
      return { kind: "native", destroy: () => void (video.src = "") };
    }
    const Hls = (await import("hls.js")).default;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: opts.isLive });
      hls.loadSource(opts.url);
      hls.attachMedia(video);
      return { kind: "hls", destroy: () => hls.destroy() };
    }
    video.src = opts.url;
    return { kind: "native", destroy: () => void (video.src = "") };
  }

  if (kind === "mpegts") {
    const mpegts = (await import("mpegts.js")).default;
    if (mpegts.getFeatureList().mseLivePlayback || mpegts.isSupported()) {
      const player = mpegts.createPlayer(
        { type: "mpegts", isLive: opts.isLive, url: opts.url },
        {
          enableStashBuffer: false, // start playing ASAP, don't pre-buffer
          stashInitialSize: 128,
          lazyLoad: false,
          liveBufferLatencyChasing: opts.isLive,
          liveBufferLatencyChasingOnPaused: false,
          liveBufferLatencyMaxLatency: 3.0,
          liveBufferLatencyMinRemain: 0.5,
          autoCleanupSourceBuffer: true,
        },
      );
      player.attachMediaElement(video);
      player.load();
      return {
        kind: "mpegts",
        destroy: () => {
          try {
            player.destroy();
          } catch {}
        },
      };
    }
    // fall through to native if MSE unavailable
    video.src = opts.url;
    return { kind: "native", destroy: () => void (video.src = "") };
  }

  // native
  video.src = opts.url;
  return { kind: "native", destroy: () => void (video.src = "") };
}
