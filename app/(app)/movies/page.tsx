"use client";

import { TopBar } from "@/components/layout/TopBar";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { useVodCategories, useVodStreams } from "@/lib/hooks";
import type { VodStream } from "@/lib/xtream/types";
import { yearFrom } from "@/lib/utils";

export default function MoviesPage() {
  const { data: cats = [] } = useVodCategories();

  return (
    <>
      <TopBar title="Movies" />
      <CatalogBrowser<VodStream>
        categories={cats}
        useItems={useVodStreams}
        toPoster={(m) => ({
          id: m.stream_id,
          name: m.name,
          poster: m.stream_icon,
          rating: m.rating,
          year: yearFrom(m.name),
        })}
        hrefFor={(m) => `/movies/${m.stream_id}`}
        emptyLabel="No movies in this category."
      />
    </>
  );
}
