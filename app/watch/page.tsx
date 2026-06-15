"use client";

import { Suspense, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { streamSrc, resolveSrc } from "@/lib/api";
import { useSeriesInfo } from "@/lib/hooks";
import { useLibrary } from "@/store/library";
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

  // VOD plays directly from the provider (fast); live must use the proxy (MSE/CORS).
  const { data: directUrl, isLoading: resolving } = useQuery({
    queryKey: ["resolve", type, id, ext],
    queryFn: () => resolveSrc(type, id, ext),
    enabled: !isLive && !!id,
    staleTime: 5 * 60 * 1000,
  });

  const sources = useMemo(() => {
    const proxy = streamSrc(type, id, ext);
    if (isLive) return [proxy];
    return directUrl ? [directUrl, proxy] : [proxy];
  }, [isLive, type, id, ext, directUrl]);

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
