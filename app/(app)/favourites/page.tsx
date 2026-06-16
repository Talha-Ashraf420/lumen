"use client";

import { Heart } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { PosterCard } from "@/components/catalog/PosterCard";
import { useLibrary } from "@/store/library";
import { cleanName } from "@/lib/utils";

export default function FavouritesPage() {
  const { favourites, freeFavourites } = useLibrary();
  const empty =
    favourites.movie.length + favourites.series.length + favourites.live.length + freeFavourites.length === 0;

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
          <Section title="Movies" count={favourites.movie.length}>
            {favourites.movie.map((m) => (
              <PosterCard key={m.id} href={`/movies/${m.id}`} item={{ id: m.id, name: m.name, poster: m.poster }} />
            ))}
          </Section>
          <Section title="Series" count={favourites.series.length}>
            {favourites.series.map((s) => (
              <PosterCard key={s.id} href={`/series/${s.id}`} item={{ id: s.id, name: s.name, poster: s.poster }} />
            ))}
          </Section>
          <Section title="Live Channels" count={favourites.live.length}>
            {favourites.live.map((c) => (
              <PosterCard
                key={c.id}
                href={`/watch?type=live&id=${c.id}&ext=ts&title=${encodeURIComponent(cleanName(c.name))}`}
                item={{ id: c.id, name: c.name, poster: c.poster, subtitle: "Live" }}
              />
            ))}
          </Section>
          <Section title="Free Channels" count={freeFavourites.length}>
            {freeFavourites.map((c) => (
              <PosterCard
                key={c.url}
                href={`/watch?type=freetv&url=${encodeURIComponent(c.url)}&title=${encodeURIComponent(c.name)}`}
                item={{ id: c.url, name: c.name, poster: c.logo, subtitle: "Free TV" }}
              />
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
      <div className="grid grid-cols-2 gap-4 px-5 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {children}
      </div>
    </section>
  );
}
