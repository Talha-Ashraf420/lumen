"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Tv, Play, Radio } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { PosterGridSkeleton } from "@/components/ui/Skeleton";
import { CategoryPicker } from "@/components/catalog/CategoryPicker";
import { api, freeTvSrc, type FreeChannel } from "@/lib/api";
import { useUI, DEFAULT_FILTER } from "@/store/ui";
import { cn } from "@/lib/utils";

const PAGE = 60;

export default function FreeTvPage() {
  const { data: catData } = useQuery({ queryKey: ["freetv", "cats"], queryFn: api.freeTvCategories });
  const categories = useMemo(
    () => (catData?.categories ?? []).map((c) => ({ category_id: c.id, category_name: c.name, parent_id: 0 })),
    [catData],
  );

  const filter = useUI((s) => s.filters.freetv ?? DEFAULT_FILTER);
  const patchFilter = useUI((s) => s.patchFilter);
  const category = filter.category || "news";
  const query = filter.query;
  const [visible, setVisible] = useState(PAGE);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["freetv", "ch", category],
    queryFn: () => api.freeTvChannels(category),
    staleTime: 30 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    let ch = data?.channels ?? [];
    const q = query.trim().toLowerCase();
    if (q) ch = ch.filter((c) => c.name.toLowerCase().includes(q));
    return ch;
  }, [data, query]);

  useEffect(() => setVisible(PAGE), [category, query, data]);

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

  return (
    <>
      <TopBar title="Free TV" />

      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/5 bg-ink-900/70 px-5 py-3 backdrop-blur-xl sm:px-8">
        <CategoryPicker
          categories={categories}
          value={category}
          onChange={(id) => patchFilter("freetv", { category: id })}
        />
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-ink-850/80 px-3.5 py-2">
          <Radio className="h-4 w-4 shrink-0 text-fog-500" />
          <input
            value={query}
            onChange={(e) => patchFilter("freetv", { query: e.target.value })}
            placeholder="Filter channels…"
            className="w-full bg-transparent text-sm placeholder:text-fog-500 focus:outline-none"
          />
        </div>
        <span className="hidden text-xs text-fog-500 sm:block">{filtered.length.toLocaleString()} channels · free</span>
      </div>

      {isLoading ? (
        <div className="py-5"><PosterGridSkeleton /></div>
      ) : isError ? (
        <p className="px-8 py-16 text-center text-sm text-red-300">{(error as Error)?.message || "Couldn’t load channels."}</p>
      ) : filtered.length === 0 ? (
        <p className="px-8 py-24 text-center text-sm text-fog-500">No channels here.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.slice(0, visible).map((c, i) => <FreeChannelTile key={`${c.id}-${i}`} channel={c} />)}
          </div>
          {visible < filtered.length && <div ref={sentinel} className="h-10" />}
        </>
      )}
    </>
  );
}

function FreeChannelTile({ channel }: { channel: FreeChannel }) {
  const href = `/watch?type=freetv&url=${encodeURIComponent(channel.url)}&title=${encodeURIComponent(channel.name)}`;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col items-center gap-2.5 rounded-2xl border border-white/5 bg-ink-850 p-4 transition-all hover:-translate-y-0.5 hover:glow-iris",
      )}
    >
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-ink-900">
        {channel.logo ? (
          <SmartImage src={channel.logo} alt={channel.name} rounded="rounded-xl" className="h-16 w-16 object-contain" />
        ) : (
          <Tv className="h-7 w-7 text-fog-500" />
        )}
      </div>
      <p className="line-clamp-2 text-center text-sm font-medium leading-snug">{channel.name}</p>
      {channel.group && <p className="text-[11px] text-fog-500">{channel.group}</p>}
      <span className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-950/40 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-iris-400 text-ink-950">
          <Play className="h-5 w-5 translate-x-0.5 fill-ink-950" />
        </span>
      </span>
    </Link>
  );
}
