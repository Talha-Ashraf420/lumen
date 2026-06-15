"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, StreamKind } from "@/lib/xtream/types";

export interface WatchProgress {
  /** unique key: `${kind}:${id}` (id = stream/episode id) */
  key: string;
  kind: StreamKind;
  id: string;
  /** for series episodes, the parent series id (for "continue with next") */
  seriesId?: string;
  title: string;
  poster?: string;
  ext: string;
  position: number; // seconds
  duration: number; // seconds
  updatedAt: number;
}

export interface FavItem {
  id: number;
  name: string;
  poster?: string;
  ext?: string;
}

interface FavSets {
  live: FavItem[];
  movie: FavItem[];
  series: FavItem[];
}

interface LibraryState {
  profiles: Profile[];
  favourites: FavSets;
  progress: Record<string, WatchProgress>;
  recentLive: number[];

  addProfile: (p: Profile) => void;
  removeProfile: (id: string) => void;

  toggleFav: (kind: keyof FavSets, item: FavItem) => void;
  isFav: (kind: keyof FavSets, id: number) => boolean;

  saveProgress: (p: WatchProgress) => void;
  clearProgress: (key: string) => void;

  pushRecentLive: (id: number) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      profiles: [],
      favourites: { live: [], movie: [], series: [] },
      progress: {},
      recentLive: [],

      addProfile: (p) =>
        set((s) => ({
          profiles: [p, ...s.profiles.filter((x) => x.id !== p.id)].slice(0, 8),
        })),
      removeProfile: (id) => set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) })),

      toggleFav: (kind, item) =>
        set((s) => {
          const has = s.favourites[kind].some((x) => x.id === item.id);
          return {
            favourites: {
              ...s.favourites,
              [kind]: has
                ? s.favourites[kind].filter((x) => x.id !== item.id)
                : [item, ...s.favourites[kind]],
            },
          };
        }),
      isFav: (kind, id) => get().favourites[kind].some((x) => x.id === id),

      saveProgress: (p) =>
        set((s) => {
          // drop near-finished items from continue-watching
          if (p.duration > 0 && p.position / p.duration > 0.95) {
            const next = { ...s.progress };
            delete next[p.key];
            return { progress: next };
          }
          return { progress: { ...s.progress, [p.key]: p } };
        }),
      clearProgress: (key) =>
        set((s) => {
          const next = { ...s.progress };
          delete next[key];
          return { progress: next };
        }),

      pushRecentLive: (id) =>
        set((s) => ({ recentLive: [id, ...s.recentLive.filter((x) => x !== id)].slice(0, 24) })),
    }),
    {
      name: "lumen-library",
      version: 2,
      // v1 stored favourites as number[]; drop them so the new object shape is clean.
      migrate: (state: unknown, version: number) => {
        const s = state as LibraryState;
        if (version < 2 && s?.favourites) {
          s.favourites = { live: [], movie: [], series: [] };
        }
        return s;
      },
    },
  ),
);

/** Continue-watching list, newest first. */
export function continueWatching(progress: Record<string, WatchProgress>): WatchProgress[] {
  return Object.values(progress)
    .filter((p) => p.duration > 0 && p.position > 15)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
