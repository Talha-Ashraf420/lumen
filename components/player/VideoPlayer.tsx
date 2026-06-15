"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  PictureInPicture2, Loader2, AlertTriangle, SkipForward, ArrowLeft,
} from "lucide-react";
import { attach, type EngineHandle } from "@/lib/player/engine";
import { formatTime, cn } from "@/lib/utils";

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
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        case "Escape": if (!document.fullscreenElement) onBack?.(); break;
      }
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, volume, togglePlay, seek, toggleFs, toggleMute, onBack, showControls]);

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
        className="h-full w-full"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFs}
      />

      {/* buffering */}
      {buffering && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-glow" />
        </div>
      )}

      {/* error */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-ink-950/90 px-6 text-center">
          <div className="max-w-md">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-glow" />
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
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-amber-glow [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-glow"
              style={{
                background: `linear-gradient(to right, var(--color-amber-glow) ${
                  duration ? (current / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) 0%)`,
              }}
            />
            <span className="w-12">{formatTime(duration)}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white transition-transform hover:scale-110">
            {playing ? <Pause className="h-7 w-7 fill-white" /> : <Play className="h-7 w-7 fill-white" />}
          </button>

          {!isLive && hasNext && (
            <button onClick={onNext} className="text-white/90 transition-transform hover:scale-110" title="Next episode">
              <SkipForward className="h-6 w-6 fill-white/90" />
            </button>
          )}

          <div className="group/vol flex items-center gap-2">
            <button onClick={toggleMute} className="text-white">
              {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/25 accent-amber-glow transition-all group-hover/vol:w-20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button onClick={togglePip} className="text-white/90 transition-transform hover:scale-110" title="Picture in picture">
              <PictureInPicture2 className="h-6 w-6" />
            </button>
            <button onClick={toggleFs} className="text-white/90 transition-transform hover:scale-110" title="Fullscreen">
              {fullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
