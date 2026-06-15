"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star, Tv, Heart, Film, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { HeroItem } from "./Hero";
import type { WatchProgress } from "@/store/library";
import { cleanName, formatTime, cn } from "@/lib/utils";

/** Large rotating featured tile — the bento centrepiece. */
export function FeaturedTile({ items, className }: { items: HeroItem[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const item = items[idx];

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!item) return <div className={cn("glass rounded-3xl", className)} />;

  return (
    <div className={cn("group relative overflow-hidden rounded-3xl ring-1 ring-white/10", className)}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <SmartImage src={item.backdrop} alt={item.title} rounded="rounded-none" className="kenburns h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <motion.div
          key={item.id + "t"}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="mb-2 inline-block rounded-full glass px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-iris-300">
            Featured
          </span>
          <h2 className="max-w-xl text-3xl font-bold leading-[1.05] tracking-tight drop-shadow-xl sm:text-5xl">
            {cleanName(item.title)}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-fog-300">
            {item.rating ? (
              <span className="flex items-center gap-1 font-semibold text-mint-300">
                <Star className="h-4 w-4 fill-mint-300" /> {item.rating.toFixed(1)}
              </span>
            ) : null}
            {item.year && <span>{item.year}</span>}
            {item.meta && <span className="line-clamp-1 text-fog-500">{item.meta}</span>}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Link
              href={item.playHref}
              className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 font-semibold text-ink-950 transition-transform hover:scale-[1.04]"
            >
              <Play className="h-5 w-5 fill-ink-950" /> Play
            </Link>
            <Link
              href={item.detailHref}
              className="flex items-center gap-2 rounded-xl glass px-4 py-2.5 font-medium transition-colors hover:bg-white/10"
            >
              <Info className="h-5 w-5" /> Info
            </Link>
          </div>
        </motion.div>

        {items.length > 1 && (
          <div className="mt-5 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn("h-1 rounded-full transition-all", i === idx ? "w-7 bg-iris-400" : "w-3 bg-white/25")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Generic glass nav tile (Live / Movies / Series / My List). */
export function NavTile({
  href,
  title,
  subtitle,
  icon,
  tint,
  className,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: "live" | "film" | "heart";
  tint: "iris" | "mint";
  className?: string;
}) {
  const Icon = icon === "live" ? Tv : icon === "film" ? Film : Heart;
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl glass p-5 transition-all hover:-translate-y-0.5 hover:glow-iris",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100",
          tint === "iris" ? "bg-iris-400/25" : "bg-mint-400/25",
        )}
      />
      <span
        className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl",
          tint === "iris" ? "bg-iris-400/15 text-iris-300" : "bg-mint-400/15 text-mint-300",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="flex items-center gap-1 text-xs text-fog-500">
          {subtitle} <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

/** Continue-watching glass tile with mini rows. */
export function ContinueTile({ items, className }: { items: WatchProgress[]; className?: string }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-3xl glass p-5", className)}>
      <p className="mb-3 flex items-center justify-between text-sm font-semibold">
        Continue Watching
        <span className="font-mono text-[10px] uppercase tracking-widest text-fog-500">resume</span>
      </p>
      <div className="-mr-2 flex flex-1 flex-col gap-2 overflow-y-auto pr-2">
        {items.slice(0, 4).map((p) => {
          const pct = p.duration > 0 ? (p.position / p.duration) * 100 : 0;
          return (
            <Link
              key={p.key}
              href={`/watch?type=${p.kind}&id=${p.id}&ext=${p.ext}&title=${encodeURIComponent(p.title)}&resume=${Math.floor(p.position)}${p.seriesId ? `&series=${p.seriesId}` : ""}`}
              className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-white/5"
            >
              <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-ink-800">
                <SmartImage src={p.poster} alt={p.title} rounded="rounded-md" className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cleanName(p.title)}</p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full bg-iris-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-fog-500">
                {formatTime(p.duration - p.position)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
