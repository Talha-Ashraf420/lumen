"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Category } from "@/lib/xtream/types";
import { FilterBar } from "./FilterBar";
import { PosterCard, type PosterItem } from "./PosterCard";
import { PosterGridSkeleton } from "@/components/ui/Skeleton";
import { sortItems, type SortKey, cleanName } from "@/lib/utils";

const PAGE = 60;

interface Sortable {
  name: string;
  added?: string;
  rating?: string | number;
}

export function CatalogBrowser<T extends Sortable>({
  categories,
  useItems,
  toPoster,
  hrefFor,
  emptyLabel = "No titles found.",
}: {
  categories: Category[];
  useItems: (categoryId?: string) => UseQueryResult<T[]>;
  toPoster: (item: T) => PosterItem;
  hrefFor: (item: T) => string;
  emptyLabel?: string;
}) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("added");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const { data, isLoading, isError, error } = useItems(category === "all" ? undefined : category);

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
        activeCategory={category}
        onCategory={setCategory}
        sort={sort}
        onSort={setSort}
        query={query}
        onQuery={setQuery}
        count={filtered.length}
      />

      {isLoading ? (
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
          <div className="grid grid-cols-3 gap-3 px-5 py-5 sm:grid-cols-4 sm:px-8 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {filtered.slice(0, visible).map((item) => (
              <PosterCard key={String(toPoster(item).id)} item={toPoster(item)} href={hrefFor(item)} />
            ))}
          </div>
          {visible < filtered.length && <div ref={sentinel} className="h-10" />}
        </>
      )}
    </div>
  );
}
