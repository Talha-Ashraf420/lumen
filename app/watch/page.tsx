"use client";

import { Suspense, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { streamSrc } from "@/lib/api";
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

  const src = streamSrc(type, id, ext);

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

  return (
    <VideoPlayer
      src={src}
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
          <Loader2 className="h-10 w-10 animate-spin text-amber-glow" />
        </div>
      }
    >
      <WatchInner />
    </Suspense>
  );
}
