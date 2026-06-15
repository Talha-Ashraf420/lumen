"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Play, Star, Clock, Calendar } from "lucide-react";
import { DetailHero } from "@/components/catalog/DetailHero";
import { Skeleton } from "@/components/ui/Skeleton";
import { useVodInfo } from "@/lib/hooks";
import { useLibrary } from "@/store/library";
import { ratingNum, yearFrom, cleanName } from "@/lib/utils";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useVodInfo(id);
  const { isFav, toggleFav, progress } = useLibrary();

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <p className="px-8 py-24 text-center text-red-300">Couldn’t load this title.</p>;

  const info = data.info;
  const md = data.movie_data;
  const title = md?.name || (info?.name as string) || "Movie";
  const ext = md?.container_extension || "mp4";
  const rating = ratingNum(info?.rating);
  const year = yearFrom(info?.releasedate, md?.added);
  const fav = isFav("movie", Number(id));

  const key = `movie:${id}`;
  const resume = progress[key]?.position ?? 0;

  const playHref = `/watch?type=movie&id=${id}&ext=${ext}&title=${encodeURIComponent(cleanName(title))}${resume > 15 ? `&resume=${Math.floor(resume)}` : ""}`;

  return (
    <DetailHero
      backdrop={info?.backdrop_path?.[0]}
      poster={info?.movie_image}
      title={title}
      fav={fav}
      onToggleFav={() =>
        toggleFav("movie", { id: Number(id), name: cleanName(title), poster: info?.movie_image, ext })
      }
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{cleanName(title)}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-fog-300">
        {rating > 0 && (
          <span className="flex items-center gap-1 font-semibold text-iris-300">
            <Star className="h-4 w-4 fill-iris-300" /> {rating.toFixed(1)}
          </span>
        )}
        {year && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {year}
          </span>
        )}
        {info?.duration && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {info.duration}
          </span>
        )}
        {info?.genre && <span className="text-fog-400">{info.genre}</span>}
      </div>

      <div className="mt-6">
        <Link
          href={playHref}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-iris-300 to-iris-500 px-7 py-3 font-semibold text-ink-950 transition-transform hover:scale-[1.03]"
        >
          <Play className="h-5 w-5 fill-ink-950" /> {resume > 15 ? "Resume" : "Play"}
        </Link>
      </div>

      {info?.plot && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fog-300">{info.plot}</p>}

      <dl className="mt-6 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {info?.cast && <Meta label="Cast" value={info.cast} />}
        {info?.director && <Meta label="Director" value={info.director} />}
        {info?.releasedate && <Meta label="Released" value={info.releasedate} />}
      </dl>
    </DetailHero>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-fog-500">{label}:</dt>
      <dd className="line-clamp-2 text-fog-300">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-5 pt-40 sm:px-8">
      <div className="flex gap-6">
        <Skeleton className="hidden aspect-[2/3] w-44 sm:block" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-24 w-full max-w-2xl" />
        </div>
      </div>
    </div>
  );
}
