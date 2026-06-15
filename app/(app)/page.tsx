"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { KineticTitle } from "@/components/ui/KineticTitle";
import { FeaturedTile, NavTile, ContinueTile } from "@/components/catalog/Bento";
import { type HeroItem } from "@/components/catalog/Hero";
import { Shelf } from "@/components/catalog/Shelf";
import { PosterCard } from "@/components/catalog/PosterCard";
import { PosterSkeletonRow, Skeleton } from "@/components/ui/Skeleton";
import { useVodCategories, useSeriesCategories, useVodStreams, useSeriesList } from "@/lib/hooks";
import { useLibrary, continueWatching } from "@/store/library";
import { sortItems, yearFrom, ratingNum } from "@/lib/utils";

const CARD = "w-[140px] shrink-0 sm:w-[165px]";

export default function HomePage() {
  const vodCats = useVodCategories();
  const seriesCats = useSeriesCategories();
  const { progress } = useLibrary();
  const cw = useMemo(() => continueWatching(progress), [progress]);

  const heroCatId = seriesCats.data?.[0]?.category_id;
  const heroSeries = useSeriesList(heroCatId);

  const heroItems: HeroItem[] = useMemo(() => {
    const withArt = (heroSeries.data ?? []).filter((s) => s.backdrop_path?.length || s.cover);
    return sortItems(withArt, "rating")
      .slice(0, 6)
      .map((s) => ({
        id: `s-${s.series_id}`,
        title: s.name,
        backdrop: s.backdrop_path?.[0] || s.cover,
        plot: s.plot,
        rating: ratingNum(s.rating) || undefined,
        year: yearFrom(s.releaseDate, s.release_date, s.name),
        meta: s.genre,
        detailHref: `/series/${s.series_id}`,
        playHref: `/series/${s.series_id}`,
      }));
  }, [heroSeries.data]);

  const shelves = useMemo(() => {
    const m = (vodCats.data ?? []).slice(0, 6).map((c) => ({ kind: "movie" as const, cat: c }));
    const s = (seriesCats.data ?? []).slice(0, 5).map((c) => ({ kind: "series" as const, cat: c }));
    const out: Array<{ kind: "movie" | "series"; cat: { category_id: string; category_name: string } }> = [];
    for (let i = 0; i < Math.max(m.length, s.length); i++) {
      if (m[i]) out.push(m[i]);
      if (s[i]) out.push(s[i]);
    }
    return out;
  }, [vodCats.data, seriesCats.data]);

  const heroLoading = seriesCats.isLoading || heroSeries.isLoading;

  return (
    <>
      <TopBar title="Lumen" />

      <div className="space-y-8 px-5 pt-6 sm:px-8">
        <KineticTitle eyebrow="Welcome back" text="What will you watch tonight?" />

        {/* bento mosaic */}
        <div className="grid auto-rows-[150px] grid-cols-2 gap-4 lg:grid-cols-6">
          {heroLoading ? (
            <Skeleton className="col-span-2 row-span-2 rounded-3xl lg:col-span-4" />
          ) : (
            <FeaturedTile items={heroItems} className="col-span-2 row-span-2 lg:col-span-4" />
          )}

          {cw.length > 0 ? (
            <ContinueTile items={cw} className="col-span-2 row-span-1 lg:col-span-2" />
          ) : (
            <NavTile
              href="/movies"
              title="Movies"
              subtitle="Browse the film library"
              icon="film"
              tint="iris"
              className="col-span-2 row-span-1 lg:col-span-2"
            />
          )}

          <NavTile href="/live" title="Live TV" subtitle="Channels & EPG" icon="live" tint="mint" className="col-span-1 row-span-1" />
          <NavTile href="/favourites" title="My List" subtitle="Saved for later" icon="heart" tint="iris" className="col-span-1 row-span-1" />
        </div>
      </div>

      {/* browse — full bleed, shelves self-pad */}
      <div className="space-y-9 py-10">
        {(vodCats.isLoading || seriesCats.isLoading) && (
          <>
            <ShelfSkeleton />
            <ShelfSkeleton />
          </>
        )}
        {shelves.map(({ kind, cat }) => (
          <CategoryShelf key={`${kind}-${cat.category_id}`} kind={kind} catId={cat.category_id} title={cat.category_name} />
        ))}
      </div>
    </>
  );
}

function CategoryShelf({ kind, catId, title }: { kind: "movie" | "series"; catId: string; title: string }) {
  const movies = useVodStreams(kind === "movie" ? catId : undefined, kind === "movie");
  const series = useSeriesList(kind === "series" ? catId : undefined, kind === "series");
  const q = kind === "movie" ? movies : series;

  if (q.isLoading) return <ShelfSkeleton title={title} />;

  if (kind === "movie") {
    const items = sortItems(movies.data ?? [], "added").slice(0, 20);
    if (items.length === 0) return null;
    return (
      <Shelf title={title}>
        {items.map((m) => (
          <PosterCard
            key={m.stream_id}
            className={CARD}
            item={{ id: m.stream_id, name: m.name, poster: m.stream_icon, rating: m.rating, year: yearFrom(m.name) }}
            href={`/movies/${m.stream_id}`}
          />
        ))}
      </Shelf>
    );
  }

  const items = sortItems(series.data ?? [], "added").slice(0, 20);
  if (items.length === 0) return null;
  return (
    <Shelf title={title}>
      {items.map((s) => (
        <PosterCard
          key={s.series_id}
          className={CARD}
          item={{ id: s.series_id, name: s.name, poster: s.cover, rating: s.rating, year: yearFrom(s.releaseDate, s.name) }}
          href={`/series/${s.series_id}`}
        />
      ))}
    </Shelf>
  );
}

function ShelfSkeleton({ title }: { title?: string }) {
  return (
    <section>
      <div className="mb-3 px-5 sm:px-8">
        {title ? <h2 className="text-lg font-semibold">{title}</h2> : <Skeleton className="h-6 w-40" />}
      </div>
      <PosterSkeletonRow />
    </section>
  );
}
