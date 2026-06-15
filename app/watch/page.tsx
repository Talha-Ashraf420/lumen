"use client";

import { Suspense, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { streamSrc, resolveSrc, transcodeSrc, api } from "@/lib/api";
import { useSeriesInfo } from "@/lib/hooks";
import { useLibrary } from "@/store/library";
import { parseDurationToSeconds } from "@/lib/utils";
import type { StreamKind, Episode } from "@/lib/xtream/types";

function WatchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { saveProgress, pushRecentLive } = useLibrary();

  const type = (params.get("type") as StreamKind) || "movie";
  const id = params.get("id") || "";
  const ext = params.get("ext") || (type === "live" ? "ts" : "mp4");
  const title = params.get("title") || "Now Playing";
  const resume = Number(params.get("resume") || 0);
  const seriesId = params.get("series") || undefined;
  const isLive = type === "live";

  // ordered episode list for next-episode (series only)
  const { data: seriesInfo } = useSeriesInfo(type === "series" ? seriesId : undefined);
  const flatEpisodes = useMemo<Episode[]>(() => {
    if (!seriesInfo?.episodes) return [];
    return Object.keys(seriesInfo.episodes)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((s) => seriesInfo.episodes[String(s)] ?? []);
  }, [seriesInfo]);

  const currentIdx = flatEpisodes.findIndex((e) => String(e.id) === id);
  const nextEp = currentIdx >= 0 ? flatEpisodes[currentIdx + 1] : undefined;
  const poster = type === "series" ? seriesInfo?.info?.cover : undefined;

  // Real runtime from provider metadata — used to show a correct total/progress
  // when a remuxed (fragmented) stream reports no duration of its own.
  const { data: movieInfo } = useQuery({
    queryKey: ["vod", "info", id],
    queryFn: () => api.vodInfo(id),
    enabled: type === "movie" && !!id,
    staleTime: 30 * 60 * 1000,
  });
  const knownDuration = useMemo(() => {
    if (type === "movie") {
      const inf = movieInfo?.info;
      return inf?.duration_secs || parseDurationToSeconds(inf?.duration) || 0;
    }
    if (type === "series") {
      const ep = flatEpisodes.find((e) => String(e.id) === id);
      return ep?.info?.duration_secs || parseDurationToSeconds(ep?.info?.duration) || 0;
    }
    return 0;
  }, [type, id, movieInfo, flatEpisodes]);

  // VOD plays directly from the provider when that's viable (fast); otherwise
  // we go straight to the proxy. Live always uses the proxy (MSE/CORS).
  const { data: resolved, isLoading: resolving } = useQuery({
    queryKey: ["resolve", type, id, ext],
    queryFn: () => resolveSrc(type, id, ext),
    enabled: !isLive && !!id,
    staleTime: 5 * 60 * 1000,
  });

  const sources = useMemo(() => {
    const proxy = streamSrc(type, id, ext);
    if (isLive) return [proxy];
    // VOD chain: [direct (only if the probe says browsers are allowed)] → proxy →
    // ffmpeg remux (handles MKV/AVI the browser can't decode natively).
    const transcode = transcodeSrc(type, id, ext);
    return [...(resolved?.directOk && resolved.url ? [resolved.url] : []), proxy, transcode];
  }, [isLive, type, id, ext, resolved]);

  // mark live channels recently-watched once
  const recentedRef = useRef(false);
  if (isLive && !recentedRef.current && id) {
    recentedRef.current = true;
    pushRecentLive(Number(id));
  }

  const lastSave = useRef(0);
  const onProgress = useCallback(
    (position: number, duration: number) => {
      if (isLive || !duration) return;
      const now = Date.now();
      if (now - lastSave.current < 5000) return;
      lastSave.current = now;
      saveProgress({
        key: `${type}:${id}`,
        kind: type,
        id,
        seriesId,
        title,
        poster: poster || undefined,
        ext,
        position,
        duration,
        updatedAt: now,
      });
    },
    [isLive, type, id, seriesId, title, poster, ext, saveProgress],
  );

  const goNext = useCallback(() => {
    if (!nextEp || !seriesId) return;
    const t = `${title.split(" · ")[0]} · ${nextEp.title || `Episode ${nextEp.episode_num}`}`;
    router.replace(
      `/watch?type=series&id=${nextEp.id}&ext=${nextEp.container_extension || "mp4"}&title=${encodeURIComponent(t)}&series=${seriesId}`,
    );
  }, [nextEp, seriesId, title, router]);

  if (!id) {
    return (
      <div className="grid h-dvh place-items-center text-fog-500">
        Nothing to play. <button onClick={() => router.back()} className="ml-2 underline">Go back</button>
      </div>
    );
  }

  if (!isLive && resolving) {
    return (
      <div className="grid h-dvh place-items-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-iris-400" />
      </div>
    );
  }

  return (
    <VideoPlayer
      sources={sources}
      ext={ext}
      isLive={isLive}
      title={title}
      startTime={resume}
      hasNext={!!nextEp}
      knownDuration={knownDuration}
      onNext={goNext}
      onBack={() => router.back()}
      onProgress={onProgress}
      onEnded={nextEp ? goNext : undefined}
    />
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-iris-400" />
        </div>
      }
    >
      <WatchInner />
    </Suspense>
  );
}
