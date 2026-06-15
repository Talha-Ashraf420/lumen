"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/xtream/types";
import { SORT_LABELS, type SortKey, cn } from "@/lib/utils";

export function FilterBar({
  categories,
  activeCategory,
  onCategory,
  sort,
  onSort,
  query,
  onQuery,
  count,
}: {
  categories: Category[];
  activeCategory: string;
  onCategory: (id: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  query: string;
  onQuery: (q: string) => void;
  count?: number;
}) {
  return (
    <div className="sticky top-[57px] z-10 space-y-3 border-b border-white/5 bg-ink-950/80 px-5 py-3 backdrop-blur-xl sm:px-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-white/8 bg-ink-850 px-3.5 py-2">
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

        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-ink-850 px-3 py-2">
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
      </div>

      {/* category chips */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
        <Chip active={activeCategory === "all"} onClick={() => onCategory("all")}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip key={c.category_id} active={activeCategory === c.category_id} onClick={() => onCategory(c.category_id)}>
            {c.category_name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-amber-glow text-ink-950"
          : "bg-ink-800 text-fog-400 hover:bg-ink-700 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
