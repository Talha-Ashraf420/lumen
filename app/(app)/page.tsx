"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Hero, type HeroItem } from "@/components/catalog/Hero";
import { Shelf } from "@/components/catalog/Shelf";
import { PosterCard } from "@/components/catalog/PosterCard";
import { PosterSkeletonRow, Skeleton } from "@/components/ui/Skeleton";
import { useVodCategories, useSeriesCategories, useVodStreams, useSeriesList } from "@/lib/hooks";
import { useLibrary, continueWatching } from "@/store/library";
import { sortItems, yearFrom, ratingNum, cleanName } from "@/lib/utils";

const CARD = "w-[140px] shrink-0 sm:w-[165px]";

export default function HomePage() {
  const vodCats = useVodCategories();
  const seriesCats = useSeriesCategories();
  const { progress, favourites } = useLibrary();
  const cw = useMemo(() => continueWatching(progress), [progress]);

  // Hero comes from the first series category (fast) — series carry backdrops.
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

  // A handful of categories → fast parallel shelves (each ~400ms vs 22s for "all").
  const shelves = useMemo(() => {
    const m = (vodCats.data ?? []).slice(0, 6).map((c) => ({ kind: "movie" as const, cat: c }));
    const s = (seriesCats.data ?? []).slice(0, 5).map((c) => ({ kind: "series" as const, cat: c }));
    // interleave so the page mixes films & shows
    const out: Array<{ kind: "movie" | "series"; cat: { category_id: string; category_name: string } }> = [];
    const max = Math.max(m.length, s.length);
    for (let i = 0; i < max; i++) {
      if (m[i]) out.push(m[i]);
      if (s[i]) out.push(s[i]);
    }
    return out;
  }, [vodCats.data, seriesCats.data]);

  const loadingHero = seriesCats.isLoading || heroSeries.isLoading;

  return (
    <>
      <TopBar title="Home" />

      {loadingHero ? (
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

        {favourites.live.length > 0 && (
          <Shelf title="Favourite Channels">
            {favourites.live.map((c) => (
              <PosterCard
                key={c.id}
                className={CARD}
                item={{ id: c.id, name: c.name, poster: c.poster, subtitle: "Live" }}
                href={`/watch?type=live&id=${c.id}&ext=ts&title=${encodeURIComponent(cleanName(c.name))}`}
              />
            ))}
          </Shelf>
        )}

        {(vodCats.isLoading || seriesCats.isLoading) && (
          <>
            <ShelfSkeleton />
            <ShelfSkeleton />
          </>
        )}

        {shelves.map(({ kind, cat }) => (
          <CategoryShelf key={`${kind}-${cat.category_id}`} kind={kind} catId={cat.category_id} title={cat.category_name} />
        ))}

        {(favourites.movie.length > 0 || favourites.series.length > 0) && (
          <Shelf title="My List">
            {[...favourites.movie.map((m) => ({ ...m, kind: "movie" as const })), ...favourites.series.map((s) => ({ ...s, kind: "series" as const }))].map((it) => (
              <PosterCard
                key={`${it.kind}-${it.id}`}
                className={CARD}
                item={{ id: it.id, name: it.name, poster: it.poster }}
                href={it.kind === "movie" ? `/movies/${it.id}` : `/series/${it.id}`}
              />
            ))}
          </Shelf>
        )}
      </div>
    </>
  );
}

function CategoryShelf({
  kind,
  catId,
  title,
}: {
  kind: "movie" | "series";
  catId: string;
  title: string;
}) {
  const movies = useVodStreams(kind === "movie" ? catId : undefined);
  const series = useSeriesList(kind === "series" ? catId : undefined);
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
