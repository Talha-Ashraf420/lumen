"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Play, Tv, Heart } from "lucide-react";
import { useLiveCategories, useLiveStreams, useEpg } from "@/lib/hooks";
import { FilterBar } from "./FilterBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { PosterGridSkeleton } from "@/components/ui/Skeleton";
import { useLibrary } from "@/store/library";
import { sortItems, type SortKey, cleanName, cn } from "@/lib/utils";
import type { LiveStream } from "@/lib/xtream/types";

const PAGE = 80;

export function LiveBrowser() {
  const { data: cats = [] } = useLiveCategories();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("az");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState(PAGE);

  const { data, isLoading, isError, error } = useLiveStreams(category === "all" ? undefined : category);

  const filtered = useMemo(() => {
    let items = data ?? [];
    const q = query.trim().toLowerCase();
    if (q) items = items.filter((c) => cleanName(c.name).toLowerCase().includes(q));
    return sortItems(items, sort);
  }, [data, query, sort]);

  useEffect(() => setVisible(PAGE), [category, sort, query, data]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => e[0].isIntersecting && setVisible((v) => Math.min(v + PAGE, filtered.length)),
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex flex-col">
      <FilterBar
        categories={cats}
        activeCategory={category}
        onCategory={setCategory}
        sort={sort}
        onSort={setSort}
        query={query}
        onQuery={setQuery}
        count={filtered.length}
        trailing={
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-850/80 p-1">
            <ViewBtn active={view === "grid"} onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></ViewBtn>
            <ViewBtn active={view === "list"} onClick={() => setView("list")}><List className="h-4 w-4" /></ViewBtn>
          </div>
        }
      />

      {isLoading ? (
        <div className="py-5"><PosterGridSkeleton /></div>
      ) : isError ? (
        <p className="px-8 py-16 text-center text-sm text-red-300">{(error as Error)?.message}</p>
      ) : filtered.length === 0 ? (
        <p className="px-8 py-24 text-center text-sm text-fog-500">No channels here.</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((c) => <ChannelTile key={c.stream_id} channel={c} />)}
        </div>
      ) : (
        <div className="divide-y divide-white/5 px-2 py-2 sm:px-6">
          {shown.map((c) => <ChannelRow key={c.stream_id} channel={c} />)}
        </div>
      )}
      {visible < filtered.length && <div ref={sentinel} className="h-10" />}
    </div>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition-colors",
        active ? "bg-iris-400 text-ink-950" : "text-fog-400 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function watchHref(c: LiveStream) {
  return `/watch?type=live&id=${c.stream_id}&ext=ts&title=${encodeURIComponent(cleanName(c.name))}`;
}

function ChannelTile({ channel }: { channel: LiveStream }) {
  const { isFav, toggleFav } = useLibrary();
  const fav = isFav("live", channel.stream_id);
  return (
    <Link
      href={watchHref(channel)}
      className="group relative flex flex-col items-center gap-2.5 rounded-[--radius-card] border border-white/5 bg-ink-850 p-4 transition-all hover:-translate-y-0.5 hover:glow-iris"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFav("live", {
            id: channel.stream_id,
            name: cleanName(channel.name),
            poster: channel.stream_icon,
            ext: "ts",
          });
        }}
        className={cn(
          "absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink-950/60 transition-colors",
          fav ? "text-iris-400" : "text-fog-500 opacity-0 group-hover:opacity-100 hover:text-foreground",
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", fav && "fill-iris-400")} />
      </button>
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-ink-900">
        {channel.stream_icon ? (
          <SmartImage src={channel.stream_icon} alt={channel.name} rounded="rounded-xl" className="h-16 w-16" />
        ) : (
          <Tv className="h-7 w-7 text-fog-500" />
        )}
      </div>
      <p className="line-clamp-2 text-center text-sm font-medium leading-snug">{cleanName(channel.name)}</p>
      <span className="absolute inset-0 grid place-items-center rounded-[--radius-card] bg-ink-950/40 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-iris-400 text-ink-950">
          <Play className="h-5 w-5 translate-x-0.5 fill-ink-950" />
        </span>
      </span>
    </Link>
  );
}

function ChannelRow({ channel }: { channel: LiveStream }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setSeen(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const { data } = useEpg(channel.stream_id, seen);
  const now = data?.epg_listings?.find((e) => e.now_playing === 1) ?? data?.epg_listings?.[0];
  const next = data?.epg_listings?.[(data?.epg_listings?.indexOf(now!) ?? -1) + 1];

  let progress = 0;
  if (now) {
    const start = Number(now.start_timestamp) * 1000;
    const stop = Number(now.stop_timestamp) * 1000;
    const dur = stop - start;
    if (dur > 0) progress = Math.min(1, Math.max(0, (Date.now() - start) / dur));
  }

  return (
    <Link
      ref={ref}
      href={watchHref(channel)}
      className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-ink-850"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-900">
        {channel.stream_icon ? (
          <SmartImage src={channel.stream_icon} alt={channel.name} rounded="rounded-lg" className="h-12 w-12" />
        ) : (
          <Tv className="h-5 w-5 text-fog-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{cleanName(channel.name)}</p>
        {now ? (
          <>
            <p className="truncate text-xs text-iris-300">{now.title}</p>
            <div className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-ink-700">
              <div className="h-full bg-iris-400" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        ) : (
          <p className="truncate text-xs text-fog-500">{seen ? "No guide data" : ""}</p>
        )}
      </div>
      {next && <p className="hidden w-40 shrink-0 truncate text-right text-xs text-fog-500 md:block">Next: {next.title}</p>}
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-800 text-fog-400 transition-colors group-hover:bg-iris-400 group-hover:text-ink-950">
        <Play className="h-4 w-4 translate-x-0.5" />
      </span>
    </Link>
  );
}
