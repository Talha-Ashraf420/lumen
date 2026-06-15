"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Hero, type HeroItem } from "@/components/catalog/Hero";
import { Shelf } from "@/components/catalog/Shelf";
import { PosterCard, type PosterItem } from "@/components/catalog/PosterCard";
import { PosterSkeletonRow } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useVodStreams, useSeriesList, useLiveStreams } from "@/lib/hooks";
import { useLibrary, continueWatching } from "@/store/library";
import { sortItems, yearFrom, ratingNum, cleanName } from "@/lib/utils";

const CARD = "w-[140px] shrink-0 sm:w-[165px]";

export default function HomePage() {
  const movies = useVodStreams();
  const series = useSeriesList();
  const live = useLiveStreams();
  const { progress, favourites } = useLibrary();

  const cw = useMemo(() => continueWatching(progress), [progress]);

  const heroItems: HeroItem[] = useMemo(() => {
    const s = (series.data ?? [])
      .filter((x) => x.backdrop_path && x.backdrop_path.length > 0)
      .sort((a, b) => ratingNum(b.rating) - ratingNum(a.rating))
      .slice(0, 5)
      .map((x) => ({
        id: `s-${x.series_id}`,
        title: x.name,
        backdrop: x.backdrop_path?.[0] || x.cover,
        plot: x.plot,
        rating: ratingNum(x.rating) || undefined,
        year: yearFrom(x.releaseDate, x.release_date, x.name),
        meta: x.genre,
        detailHref: `/series/${x.series_id}`,
        playHref: `/series/${x.series_id}`,
      }));
    if (s.length >= 3) return s;
    // fallback: top movies (poster as backdrop)
    const m = sortItems(movies.data ?? [], "rating")
      .slice(0, 5)
      .map((x) => ({
        id: `m-${x.stream_id}`,
        title: x.name,
        backdrop: x.stream_icon,
        rating: ratingNum(x.rating) || undefined,
        year: yearFrom(x.name),
        detailHref: `/movies/${x.stream_id}`,
        playHref: `/movies/${x.stream_id}`,
      }));
    return [...s, ...m].slice(0, 5);
  }, [series.data, movies.data]);

  const recentMovies = useMemo(() => sortItems(movies.data ?? [], "added").slice(0, 24), [movies.data]);
  const topMovies = useMemo(() => sortItems(movies.data ?? [], "rating").slice(0, 24), [movies.data]);
  const recentSeries = useMemo(() => sortItems(series.data ?? [], "added").slice(0, 24), [series.data]);

  const favMovies = useMemo(
    () => (movies.data ?? []).filter((m) => favourites.movie.includes(m.stream_id)).slice(0, 24),
    [movies.data, favourites.movie],
  );
  const favLive = useMemo(
    () => (live.data ?? []).filter((c) => favourites.live.includes(c.stream_id)).slice(0, 24),
    [live.data, favourites.live],
  );

  const loading = movies.isLoading && series.isLoading;

  return (
    <>
      <TopBar title="Home" />

      {loading ? (
        <Skeleton className="h-[52vh] min-h-[360px] w-full rounded-none" />
      ) : heroItems.length > 0 ? (
        <Hero items={heroItems} />
      ) : null}

      <div className="space-y-9 py-8">
        {cw.length > 0 && (
          <Shelf title="Continue Watching">
            {cw.map((p) => (
              <PosterCard
                key={p.key}
                className={CARD}
                item={{
                  id: p.key,
                  name: p.title,
                  poster: p.poster,
                  progress: p.duration > 0 ? p.position / p.duration : 0,
                  subtitle: p.kind === "series" ? "Episode" : "Movie",
                }}
                href={`/watch?type=${p.kind}&id=${p.id}&ext=${p.ext}&title=${encodeURIComponent(p.title)}&resume=${Math.floor(p.position)}${p.seriesId ? `&series=${p.seriesId}` : ""}`}
              />
            ))}
          </Shelf>
        )}

        {favLive.length > 0 && (
          <Shelf title="Favourite Channels">
            {favLive.map((c) => (
              <PosterCard
                key={c.stream_id}
                className={CARD}
                item={{ id: c.stream_id, name: c.name, poster: c.stream_icon, subtitle: "Live" }}
                href={`/watch?type=live&id=${c.stream_id}&ext=ts&title=${encodeURIComponent(cleanName(c.name))}`}
              />
            ))}
          </Shelf>
        )}

        <MovieShelf title="Recently Added Movies" loading={movies.isLoading} items={recentMovies} />
        <MovieShelf title="Top Rated Movies" loading={movies.isLoading} items={topMovies} />
        <SeriesShelf title="Fresh Series" loading={series.isLoading} items={recentSeries} />

        {favMovies.length > 0 && (
          <MovieShelf title="My List" loading={false} items={favMovies} />
        )}
      </div>
    </>
  );
}

function MovieShelf({
  title,
  items,
  loading,
}: {
  title: string;
  items: Array<{ stream_id: number; name: string; stream_icon: string; rating: string | number }>;
  loading: boolean;
}) {
  if (loading) return <ShelfSkeleton title={title} />;
  if (items.length === 0) return null;
  return (
    <Shelf title={title}>
      {items.map((m) => (
        <PosterCard
          key={m.stream_id}
          className={CARD}
          item={mapPoster(m.stream_id, m.name, m.stream_icon, m.rating, yearFrom(m.name))}
          href={`/movies/${m.stream_id}`}
        />
      ))}
    </Shelf>
  );
}

function SeriesShelf({
  title,
  items,
  loading,
}: {
  title: string;
  items: Array<{ series_id: number; name: string; cover: string; rating: string | number; releaseDate?: string }>;
  loading: boolean;
}) {
  if (loading) return <ShelfSkeleton title={title} />;
  if (items.length === 0) return null;
  return (
    <Shelf title={title}>
      {items.map((s) => (
        <PosterCard
          key={s.series_id}
          className={CARD}
          item={mapPoster(s.series_id, s.name, s.cover, s.rating, yearFrom(s.releaseDate, s.name))}
          href={`/series/${s.series_id}`}
        />
      ))}
    </Shelf>
  );
}

function mapPoster(
  id: number,
  name: string,
  poster: string,
  rating: string | number,
  year: string,
): PosterItem {
  return { id, name, poster, rating, year };
}

function ShelfSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h2 className="mb-3 px-5 text-lg font-semibold sm:px-8">{title}</h2>
      <PosterSkeletonRow />
    </section>
  );
}
