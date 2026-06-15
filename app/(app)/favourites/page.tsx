"use client";

import { useMemo } from "react";
import { Heart } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PosterCard } from "@/components/catalog/PosterCard";
import { useVodStreams, useSeriesList, useLiveStreams } from "@/lib/hooks";
import { useLibrary } from "@/store/library";
import { cleanName, yearFrom } from "@/lib/utils";

export default function FavouritesPage() {
  const movies = useVodStreams();
  const series = useSeriesList();
  const live = useLiveStreams();
  const { favourites } = useLibrary();

  const favMovies = useMemo(
    () => (movies.data ?? []).filter((m) => favourites.movie.includes(m.stream_id)),
    [movies.data, favourites.movie],
  );
  const favSeries = useMemo(
    () => (series.data ?? []).filter((s) => favourites.series.includes(s.series_id)),
    [series.data, favourites.series],
  );
  const favLive = useMemo(
    () => (live.data ?? []).filter((c) => favourites.live.includes(c.stream_id)),
    [live.data, favourites.live],
  );

  const empty = favMovies.length + favSeries.length + favLive.length === 0;

  return (
    <>
      <TopBar title="My List" />
      {empty ? (
        <div className="flex flex-col items-center gap-3 px-8 py-32 text-center text-fog-500">
          <Heart className="h-10 w-10" />
          <p className="text-sm">Nothing saved yet. Tap the heart on any movie, series or channel.</p>
        </div>
      ) : (
        <div className="space-y-10 py-6">
          <Section title="Movies" count={favMovies.length}>
            {favMovies.map((m) => (
              <PosterCard key={m.stream_id} href={`/movies/${m.stream_id}`} item={{ id: m.stream_id, name: m.name, poster: m.stream_icon, rating: m.rating, year: yearFrom(m.name) }} />
            ))}
          </Section>
          <Section title="Series" count={favSeries.length}>
            {favSeries.map((s) => (
              <PosterCard key={s.series_id} href={`/series/${s.series_id}`} item={{ id: s.series_id, name: s.name, poster: s.cover, rating: s.rating, year: yearFrom(s.releaseDate, s.name) }} />
            ))}
          </Section>
          <Section title="Live Channels" count={favLive.length}>
            {favLive.map((c) => (
              <PosterCard key={c.stream_id} href={`/watch?type=live&id=${c.stream_id}&ext=ts&title=${encodeURIComponent(cleanName(c.name))}`} item={{ id: c.stream_id, name: c.name, poster: c.stream_icon, subtitle: "Live" }} />
            ))}
          </Section>
        </div>
      )}
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="mb-3 px-5 text-lg font-semibold sm:px-8">{title}</h2>
      <div className="grid grid-cols-3 gap-3 px-5 sm:grid-cols-4 sm:px-8 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {children}
      </div>
    </section>
  );
}
