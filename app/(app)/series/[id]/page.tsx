"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Play, Star, Calendar, Clock } from "lucide-react";
import { DetailHero } from "@/components/catalog/DetailHero";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSeriesInfo } from "@/lib/hooks";
import { useLibrary } from "@/store/library";
import { ratingNum, yearFrom, cleanName, cn } from "@/lib/utils";
import type { Episode } from "@/lib/xtream/types";

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useSeriesInfo(id);
  const { isFav, toggleFav, progress } = useLibrary();

  const seasons = useMemo(() => {
    if (!data?.episodes) return [];
    return Object.keys(data.episodes)
      .map((n) => Number(n))
      .filter((n) => (data.episodes[String(n)] ?? []).length > 0)
      .sort((a, b) => a - b);
  }, [data]);

  const [season, setSeason] = useState<number | null>(null);
  const activeSeason = season ?? seasons[0] ?? null;

  if (isLoading) return <SeriesSkeleton />;
  if (isError || !data) return <p className="px-8 py-24 text-center text-red-300">Couldn’t load this series.</p>;

  const info = data.info;
  const title = (info?.name as string) || "Series";
  const rating = ratingNum(info?.rating);
  const year = yearFrom(info?.releaseDate, info?.name as string);
  const fav = isFav("series", Number(id));

  const episodes = activeSeason !== null ? data.episodes[String(activeSeason)] ?? [] : [];

  return (
    <DetailHero
      backdrop={info?.backdrop_path?.[0]}
      poster={info?.cover}
      title={title}
      fav={fav}
      onToggleFav={() => toggleFav("series", Number(id))}
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{cleanName(title)}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fog-300">
        {rating > 0 && (
          <span className="flex items-center gap-1 font-semibold text-amber-soft">
            <Star className="h-4 w-4 fill-amber-soft" /> {rating.toFixed(1)}
          </span>
        )}
        {year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {year}</span>}
        {info?.genre && <span className="text-fog-400">{info.genre}</span>}
        <span className="text-fog-500">{seasons.length} season{seasons.length === 1 ? "" : "s"}</span>
      </div>

      {info?.plot && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-fog-300">{info.plot}</p>}

      {/* season selector */}
      {seasons.length > 0 && (
        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                s === activeSeason ? "bg-amber-glow text-ink-950" : "bg-ink-800 text-fog-400 hover:bg-ink-700",
              )}
            >
              Season {s}
            </button>
          ))}
        </div>
      )}

      {/* episodes */}
      <div className="mt-5 max-w-3xl space-y-2.5 pb-12">
        {episodes.map((ep) => (
          <EpisodeRow key={ep.id} ep={ep} seriesId={id} title={title} resume={progress[`series:${ep.id}`]?.position ?? 0} />
        ))}
        {episodes.length === 0 && <p className="text-sm text-fog-500">No episodes listed for this season.</p>}
      </div>
    </DetailHero>
  );
}

function EpisodeRow({
  ep,
  seriesId,
  title,
  resume,
}: {
  ep: Episode;
  seriesId: string;
  title: string;
  resume: number;
}) {
  const ext = ep.container_extension || "mp4";
  const epTitle = ep.title || `Episode ${ep.episode_num}`;
  const href = `/watch?type=series&id=${ep.id}&ext=${ext}&title=${encodeURIComponent(`${cleanName(title)} · ${epTitle}`)}&series=${seriesId}${resume > 15 ? `&resume=${Math.floor(resume)}` : ""}`;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/5 bg-ink-850/60 p-2.5 transition-colors hover:bg-ink-800"
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-ink-900 sm:w-40">
        <SmartImage src={ep.info?.movie_image} alt={epTitle} rounded="rounded-lg" className="h-full w-full" />
        <span className="absolute inset-0 grid place-items-center bg-ink-950/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-glow text-ink-950">
            <Play className="h-4 w-4 translate-x-0.5 fill-ink-950" />
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <span className="text-fog-500">{ep.episode_num}.</span>
          <span className="truncate">{epTitle}</span>
        </p>
        {ep.info?.duration && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-fog-500">
            <Clock className="h-3 w-3" /> {ep.info.duration}
          </p>
        )}
        {ep.info?.plot && <p className="mt-1 line-clamp-2 text-xs text-fog-400">{ep.info.plot}</p>}
      </div>
    </Link>
  );
}

function SeriesSkeleton() {
  return (
    <div className="px-5 pt-40 sm:px-8">
      <div className="flex gap-6">
        <Skeleton className="hidden aspect-[2/3] w-44 sm:block" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full max-w-2xl" />
          <div className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
        </div>
      </div>
    </div>
  );
}
