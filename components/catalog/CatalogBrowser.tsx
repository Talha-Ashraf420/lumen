"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Category } from "@/lib/xtream/types";
import { FilterBar } from "./FilterBar";
import { PosterCard, type PosterItem } from "./PosterCard";
import { PosterGridSkeleton } from "@/components/ui/Skeleton";
import { useUI, DEFAULT_FILTER } from "@/store/ui";
import { sortItems, type SortKey, cleanName } from "@/lib/utils";

const PAGE = 60;

interface Sortable {
  name: string;
  added?: string;
  rating?: string | number;
}

export function CatalogBrowser<T extends Sortable>({
  sectionKey,
  categories,
  useItems,
  toPoster,
  hrefFor,
  emptyLabel = "No titles found.",
}: {
  sectionKey: string;
  categories: Category[];
  useItems: (categoryId?: string, enabled?: boolean) => UseQueryResult<T[]>;
  toPoster: (item: T) => PosterItem;
  hrefFor: (item: T) => string;
  emptyLabel?: string;
}) {
  // Filter state is persisted per-section so it survives navigation/playback/reload.
  const filter = useUI((s) => s.filters[sectionKey] ?? DEFAULT_FILTER);
  const patchFilter = useUI((s) => s.patchFilter);
  const { category: storedCategory, sort, query } = filter;

  const [visible, setVisible] = useState(PAGE);

  const setCategory = (id: string) => patchFilter(sectionKey, { category: id });
  const setSort = (s: SortKey) => patchFilter(sectionKey, { sort: s });
  const setQuery = (q: string) => patchFilter(sectionKey, { query: q });

  // "" = unset → default to the first category (fast) instead of "all" (slow).
  useEffect(() => {
    if (!storedCategory && categories.length > 0) {
      patchFilter(sectionKey, { category: categories[0].category_id });
    }
  }, [categories, storedCategory, sectionKey, patchFilter]);

  const category = storedCategory || null;
  const ready = !!category;
  const fetchCat = category && category !== "all" ? category : undefined;
  const { data, isLoading, isError, error } = useItems(fetchCat, ready);

  const filtered = useMemo(() => {
    let items = data ?? [];
    const q = query.trim().toLowerCase();
    if (q) items = items.filter((it) => cleanName(it.name).toLowerCase().includes(q));
    return sortItems(items, sort);
  }, [data, query, sort]);

  // reset window when inputs change
  useEffect(() => setVisible(PAGE), [category, sort, query, data]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => Math.min(v + PAGE, filtered.length));
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  return (
    <div className="flex flex-col">
      <FilterBar
        categories={categories}
        activeCategory={category ?? ""}
        onCategory={setCategory}
        sort={sort}
        onSort={setSort}
        query={query}
        onQuery={setQuery}
        count={filtered.length}
      />

      {!ready || isLoading ? (
        <div className="py-5">
          <PosterGridSkeleton />
        </div>
      ) : isError ? (
        <p className="px-8 py-16 text-center text-sm text-red-300">
          {(error as Error)?.message || "Failed to load."}
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-8 py-24 text-center text-sm text-fog-500">{emptyLabel}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 px-5 py-6 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.slice(0, visible).map((item, i) => (
              <PosterCard
                key={String(toPoster(item).id)}
                item={toPoster(item)}
                href={hrefFor(item)}
                index={i % PAGE}
              />
            ))}
          </div>
          {visible < filtered.length && <div ref={sentinel} className="h-10" />}
        </>
      )}
    </div>
  );
}
