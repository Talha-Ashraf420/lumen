"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/lib/xtream/types";

// once per page-load session
let warmed = false;

/**
 * After login, quietly warm the catalog in the background so navigating to
 * Movies/Series/Live is instant (the provider's first fetch is slow). Mounted
 * once in the app shell; never blocks the UI.
 */
export function CatalogWarmer() {
  const qc = useQueryClient();

  useEffect(() => {
    if (warmed) return;
    warmed = true;
    let cancelled = false;

    const run = async () => {
      // let the current page paint first
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;

      // category lists are small + fast — these make the filter bars instant
      const [vodCats, seriesCats] = await Promise.all([
        qc.fetchQuery({ queryKey: ["vod", "cats"], queryFn: api.vodCategories }).catch(() => [] as Category[]),
        qc.fetchQuery({ queryKey: ["series", "cats"], queryFn: api.seriesCategories }).catch(() => [] as Category[]),
      ]);
      qc.prefetchQuery({ queryKey: ["live", "cats"], queryFn: api.liveCategories });
      if (cancelled) return;

      // warm the first category of each (what those pages open to) — cheap (~400ms)
      const firstVod = (vodCats as Category[])[0]?.category_id;
      const firstSeries = (seriesCats as Category[])[0]?.category_id;
      if (firstVod) qc.prefetchQuery({ queryKey: ["vod", "streams", firstVod], queryFn: () => api.vodStreams(firstVod) });
      if (firstSeries) qc.prefetchQuery({ queryKey: ["series", "list", firstSeries], queryFn: () => api.series(firstSeries) });
      qc.prefetchQuery({ queryKey: ["live", "streams", "all"], queryFn: () => api.liveStreams() });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [qc]);

  return null;
}
