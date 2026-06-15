"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  PictureInPicture2, Loader2, AlertTriangle, SkipForward, ArrowLeft,
  RotateCcw, RotateCw, Captions, Gauge, Check, Upload,
} from "lucide-react";
import { attach, type EngineHandle } from "@/lib/player/engine";
import { formatTime, cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Convert SubRip (.srt) text to WebVTT so the browser can render it. */
function srtToVtt(text: string): string {
  const body = text
    .replace(/\r+/g, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return /^WEBVTT/.test(body.trimStart()) ? body : `WEBVTT\n\n${body}`;
}

export function VideoPlayer({
  sources,
  ext,
  isLive,
  title,
  startTime = 0,
  hasNext,
  onNext,
  onBack,
  onProgress,
  onEnded,
  subtitles = [],
}: {
  /** Ordered candidate URLs — first is tried, next used on failure (direct → proxy). */
  sources: string[];
  ext: string;
  isLive: boolean;
  title: string;
  startTime?: number;
  hasNext?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
  /** Provider-supplied subtitle tracks (proxied .vtt URLs). */
  subtitles?: Array<{ label: string; src: string; lang?: string }>;
}) {
  const extSubs = subtitles;
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subFileRef = useRef<HTMLInputElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsOn, setControlsOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [srcIdx, setSrcIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedMenu, setSpeedMenu] = useState(false);
  const [subUrl, setSubUrl] = useState<string | null>(null);
  const [subName, setSubName] = useState<string | null>(null);
  const [capMenu, setCapMenu] = useState(false);
  const [trackList, setTrackList] = useState<Array<{ index: number; label: string }>>([]);
  const [activeTrack, setActiveTrack] = useState<number>(-1); // -1 = off

  const src = sources[srcIdx] ?? sources[0];

  // reset to the preferred source whenever the candidate list changes
  useEffect(() => setSrcIdx(0), [sources]);

  const tryFallback = useCallback(
    (msg: string) => {
      setSrcIdx((i) => {
        if (i < sources.length - 1) {
          setError(null);
          setBuffering(true);
          return i + 1;
        }
        setError(msg);
        return i;
      });
    },
    [sources.length],
  );

  // (re)attach engine when src changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let cancelled = false;
    setBuffering(true);

    (async () => {
      try {
        engineRef.current?.destroy();
        engineRef.current = await attach(video, { url: src, ext, isLive });
        if (cancelled) return;
        video.play().catch(() => {});
      } catch (e) {
        if (!cancelled) tryFallback((e as Error).message || "Playback failed");
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [src, ext, isLive, tryFallback]);

  // media element events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onLoaded = () => {
      setDuration(v.duration || 0);
      if (!isLive && startTime > 0 && startTime < (v.duration || Infinity)) v.currentTime = startTime;
    };
    const onTime = () => {
      setCurrent(v.currentTime);
      setDuration(v.duration || 0);
      onProgress?.(v.currentTime, v.duration || 0);
    };
    const onEnd = () => onEnded?.();
    const onErr = () =>
      tryFallback(
        `This stream couldn't be played in the browser${
          /mkv|avi|wmv/i.test(ext) ? ` (.${ext} often needs VLC).` : "."
        }`,
      );

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onErr);
    };
  }, [ext, isLive, startTime, onProgress, onEnded, tryFallback]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (v && !isLive) v.currentTime = Math.max(0, Math.min(t, v.duration || 0));
  }, [isLive]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen().catch(() => {});
  }, []);

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {}
  };

  // keep playbackRate applied across source swaps
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, src]);

  const applySpeed = (s: number) => {
    setSpeed(s);
    setSpeedMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const loadSubtitleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const vtt = file.name.toLowerCase().endsWith(".vtt") ? raw : srtToVtt(raw);
      const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
      setSubUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setSubName(file.name);
      // select the newly added (last) track shortly after it mounts
      setTimeout(() => {
        const v = videoRef.current;
        if (v && v.textTracks.length) selectTrack(v.textTracks.length - 1);
      }, 250);
    };
    reader.readAsText(file);
  };

  const selectTrack = useCallback((idx: number) => {
    const v = videoRef.current;
    if (!v) return;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = i === idx ? "showing" : "disabled";
    }
    setActiveTrack(idx);
  }, []);

  // keep the visible track list in sync with the <video>'s text tracks
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const refresh = () => {
      const list: Array<{ index: number; label: string }> = [];
      for (let i = 0; i < v.textTracks.length; i++) {
        const t = v.textTracks[i];
        list.push({ index: i, label: t.label || t.language || `Track ${i + 1}` });
      }
      setTrackList(list);
    };
    refresh();
    const t = setTimeout(refresh, 400);
    v.textTracks.addEventListener?.("addtrack", refresh);
    v.textTracks.addEventListener?.("removetrack", refresh);
    return () => {
      clearTimeout(t);
      v.textTracks.removeEventListener?.("addtrack", refresh);
      v.textTracks.removeEventListener?.("removetrack", refresh);
    };
  }, [subUrl, extSubs, src]);

  const showControls = useCallback(() => {
    setControlsOn(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setControlsOn(false);
    }, 3000);
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": seek(current + 10); break;
        case "ArrowLeft": seek(current - 10); break;
        case "ArrowUp": changeVolume(Math.min(1, volume + 0.1)); break;
        case "ArrowDown": changeVolume(Math.max(0, volume - 0.1)); break;
        case "f": toggleFs(); break;
        case "m": toggleMute(); break;
        case "c":
          if (trackList.length) selectTrack(activeTrack >= 0 ? -1 : 0);
          break;
        case "n": if (hasNext) onNext?.(); break;
        case "Escape": if (!document.fullscreenElement) onBack?.(); break;
      }
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, volume, togglePlay, seek, toggleFs, toggleMute, onBack, showControls, trackList, activeTrack, selectTrack, hasNext, onNext]);

  return (
    <div
      ref={wrapRef}
      onMouseMove={showControls}
      onClick={showControls}
      className={cn(
        "group relative h-dvh w-full select-none bg-black",
        controlsOn ? "cursor-default" : "cursor-none",
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFs}
      >
        {extSubs.map((s, i) => (
          <track key={`ext-${i}`} kind="subtitles" src={s.src} label={s.label} srcLang={s.lang} />
        ))}
        {subUrl && <track kind="subtitles" src={subUrl} label={subName || "Loaded file"} />}
      </video>

      {/* hidden subtitle file picker */}
      <input
        ref={subFileRef}
        type="file"
        accept=".srt,.vtt,text/vtt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) loadSubtitleFile(f);
          e.target.value = "";
        }}
      />

      {/* buffering */}
      {buffering && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="h-12 w-12 animate-spin text-iris-400" />
        </div>
      )}

      {/* error */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-ink-950/90 px-6 text-center">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-iris-400" />
            <p className="text-lg font-semibold">Can’t play this stream</p>
            <p className="mt-2 text-sm text-fog-400">{error}</p>
            <button
              onClick={onBack}
              className="mt-6 rounded-xl bg-ink-700 px-5 py-2.5 text-sm font-medium hover:bg-ink-600"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* top gradient + title + back */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 flex items-start gap-3 bg-gradient-to-b from-black/80 to-transparent px-5 pb-12 pt-5 transition-opacity sm:px-8",
          controlsOn ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onClick={onBack}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 pt-1">
          {isLive && (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Live
            </span>
          )}
          <h2 className="truncate text-lg font-semibold drop-shadow">{title}</h2>
        </div>
      </div>

      {/* bottom controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-5 pt-16 transition-opacity sm:px-8",
          controlsOn ? "opacity-100" : "opacity-0",
        )}
      >
        {/* seek bar (VOD only) */}
        {!isLive && (
          <div className="mb-3 flex items-center gap-3 text-xs tabular-nums text-fog-300">
            <span className="w-12 text-right">{formatTime(current)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={current}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-iris-400 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-iris-400"
              style={{
                background: `linear-gradient(to right, var(--color-iris-400) ${
                  duration ? (current / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) 0%)`,
              }}
            />
            <span className="w-12">{formatTime(duration)}</span>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={togglePlay} className="text-white transition-transform hover:scale-110" title="Play/Pause (space)">
            {playing ? <Pause className="h-7 w-7 fill-white" /> : <Play className="h-7 w-7 fill-white" />}
          </button>

          {!isLive && (
            <>
              <button onClick={() => seek(current - 10)} className="relative text-white/90 transition-transform hover:scale-110" title="Back 10s (←)">
                <RotateCcw className="h-6 w-6" />
                <span className="absolute inset-0 grid place-items-center text-[8px] font-bold">10</span>
              </button>
              <button onClick={() => seek(current + 10)} className="relative text-white/90 transition-transform hover:scale-110" title="Forward 10s (→)">
                <RotateCw className="h-6 w-6" />
                <span className="absolute inset-0 grid place-items-center text-[8px] font-bold">10</span>
              </button>
            </>
          )}

          {!isLive && hasNext && (
            <button onClick={onNext} className="text-white/90 transition-transform hover:scale-110" title="Next episode (n)">
              <SkipForward className="h-6 w-6 fill-white/90" />
            </button>
          )}

          <div className="group/vol flex items-center gap-2">
            <button onClick={toggleMute} className="text-white" title="Mute (m)">
              {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/25 accent-iris-400 transition-all group-hover/vol:w-20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            {/* subtitles / captions menu */}
            <div className="relative">
              <button
                onClick={() => setCapMenu((v) => !v)}
                className={cn("transition-transform hover:scale-110", activeTrack >= 0 ? "text-iris-400" : "text-white/90")}
                title="Subtitles (c)"
              >
                <Captions className="h-6 w-6" />
              </button>
              {capMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCapMenu(false)} />
                  <div className="absolute bottom-10 right-0 z-20 max-h-72 w-56 overflow-y-auto rounded-xl glass py-1 text-sm shadow-2xl">
                    <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog-500">Subtitles</p>
                    <button
                      onClick={() => { selectTrack(-1); setCapMenu(false); }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/10"
                    >
                      <span>Off</span>
                      {activeTrack === -1 && <Check className="h-3.5 w-3.5 text-iris-400" />}
                    </button>
                    {trackList.map((t) => (
                      <button
                        key={t.index}
                        onClick={() => { selectTrack(t.index); setCapMenu(false); }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-white/10"
                      >
                        <span className="truncate">{t.label}</span>
                        {activeTrack === t.index && <Check className="h-3.5 w-3.5 shrink-0 text-iris-400" />}
                      </button>
                    ))}
                    {trackList.length === 0 && (
                      <p className="px-3 py-1.5 text-xs text-fog-500">No embedded captions found.</p>
                    )}
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      onClick={() => { subFileRef.current?.click(); setCapMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-iris-300 hover:bg-white/10"
                    >
                      <Upload className="h-3.5 w-3.5" /> Load from file…
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* playback speed */}
            {!isLive && (
              <div className="relative">
                <button
                  onClick={() => setSpeedMenu((v) => !v)}
                  className={cn("flex items-center gap-1 transition-transform hover:scale-110", speed !== 1 ? "text-iris-400" : "text-white/90")}
                  title="Playback speed"
                >
                  <Gauge className="h-6 w-6" />
                  {speed !== 1 && <span className="text-xs font-semibold">{speed}x</span>}
                </button>
                {speedMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSpeedMenu(false)} />
                    <div className="absolute bottom-10 right-0 z-20 w-28 overflow-hidden rounded-xl glass py-1 text-sm shadow-2xl">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => applySpeed(s)}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-white/10"
                        >
                          <span>{s === 1 ? "Normal" : `${s}x`}</span>
                          {speed === s && <Check className="h-3.5 w-3.5 text-iris-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={togglePip} className="text-white/90 transition-transform hover:scale-110" title="Picture in picture">
              <PictureInPicture2 className="h-6 w-6" />
            </button>
            <button onClick={toggleFs} className="text-white/90 transition-transform hover:scale-110" title="Fullscreen (f)">
              {fullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
