"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortKey } from "@/lib/utils";

export interface SectionFilter {
  category: string; // "" = unset (auto-pick first) · "all" · or a category_id
  sort: SortKey;
  query: string;
  view: "grid" | "list";
}

export const DEFAULT_FILTER: SectionFilter = { category: "", sort: "added", query: "", view: "grid" };

interface UIState {
  /** keyed by section: "movies" | "series" | "live" */
  filters: Record<string, SectionFilter>;
  searchQuery: string;
  patchFilter: (key: string, patch: Partial<SectionFilter>) => void;
  setSearchQuery: (q: string) => void;
}

/** Remembers per-section category/sort/filter + global search across navigation. */
export const useUI = create<UIState>()(
  persist(
    (set) => ({
      filters: {},
      searchQuery: "",
      patchFilter: (key, patch) =>
        set((s) => ({
          filters: { ...s.filters, [key]: { ...DEFAULT_FILTER, ...s.filters[key], ...patch } },
        })),
      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    { name: "lumen-ui" },
  ),
);
