"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/xtream/types";
import { CategoryPicker } from "./CategoryPicker";
import { SORT_LABELS, type SortKey } from "@/lib/utils";

export function FilterBar({
  categories,
  activeCategory,
  onCategory,
  sort,
  onSort,
  query,
  onQuery,
  count,
  trailing,
}: {
  categories: Category[];
  activeCategory: string;
  onCategory: (id: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  query: string;
  onQuery: (q: string) => void;
  count?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="sticky top-[57px] z-10 flex flex-wrap items-center gap-2.5 border-b border-white/5 bg-ink-900/70 px-5 py-3 backdrop-blur-xl sm:px-8">
      {/* searchable category list */}
      <CategoryPicker categories={categories} value={activeCategory} onChange={onCategory} />

      {/* text filter */}
      <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-ink-850/80 px-3.5 py-2">
        <Search className="h-4 w-4 shrink-0 text-fog-500" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter in this section…"
          className="w-full bg-transparent text-sm placeholder:text-fog-500 focus:outline-none"
        />
        {query && (
          <button onClick={() => onQuery("")} className="text-fog-500 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* sort */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-850/80 px-3 py-2">
        <SlidersHorizontal className="h-4 w-4 text-fog-500" />
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="bg-transparent text-sm font-medium text-foreground focus:outline-none [&>option]:bg-ink-800"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {count !== undefined && (
        <span className="hidden text-xs text-fog-500 sm:block">{count.toLocaleString()} titles</span>
      )}

      {trailing}
    </div>
  );
}
