"use client";

import { TopBar } from "@/components/layout/TopBar";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { useSeriesCategories, useSeriesList } from "@/lib/hooks";
import type { Series } from "@/lib/xtream/types";
import { yearFrom } from "@/lib/utils";

export default function SeriesPage() {
  const { data: cats = [] } = useSeriesCategories();

  return (
    <>
      <TopBar title="Series" />
      <CatalogBrowser<Series>
        categories={cats}
        useItems={useSeriesList}
        toPoster={(s) => ({
          id: s.series_id,
          name: s.name,
          poster: s.cover,
          rating: s.rating,
          year: yearFrom(s.releaseDate, s.release_date, s.name),
        })}
        hrefFor={(s) => `/series/${s.series_id}`}
        emptyLabel="No series in this category."
      />
    </>
  );
}
