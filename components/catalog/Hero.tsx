"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Info, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cleanName } from "@/lib/utils";

export interface HeroItem {
  id: string;
  title: string;
  backdrop?: string;
  plot?: string;
  rating?: number;
  year?: string;
  meta?: string;
  detailHref: string;
  playHref: string;
}

export function Hero({ items }: { items: HeroItem[] }) {
  const [idx, setIdx] = useState(0);
  const item = items[idx];

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!item) return null;

  return (
    <div className="relative h-[52vh] min-h-[360px] w-full overflow-hidden sm:h-[62vh]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <SmartImage src={item.backdrop} alt={item.title} rounded="rounded-none" className="h-full w-full" />
        </motion.div>
      </AnimatePresence>

      {/* scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-5 pb-10 sm:px-8 sm:pb-14">
        <motion.div
          key={item.id + "-text"}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-2xl"
        >
          <h1 className="text-3xl font-bold leading-tight tracking-tight drop-shadow-lg sm:text-5xl">
            {cleanName(item.title)}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-fog-300">
            {item.rating ? (
              <span className="flex items-center gap-1 font-semibold text-iris-300">
                <Star className="h-4 w-4 fill-iris-300" /> {item.rating.toFixed(1)}
              </span>
            ) : null}
            {item.year && <span>{item.year}</span>}
            {item.meta && <span className="text-fog-500">{item.meta}</span>}
          </div>
          {item.plot && (
            <p className="mt-3 line-clamp-2 max-w-xl text-sm text-fog-300 sm:text-base">{item.plot}</p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Link
              href={item.playHref}
              className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 font-semibold text-ink-950 transition-transform hover:scale-[1.03]"
            >
              <Play className="h-5 w-5 fill-ink-950" /> Play
            </Link>
            <Link
              href={item.detailHref}
              className="flex items-center gap-2 rounded-xl glass px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-ink-700/70"
            >
              <Info className="h-5 w-5" /> More Info
            </Link>
          </div>

          {items.length > 1 && (
            <div className="mt-6 flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    i === idx ? "w-7 bg-iris-400" : "w-3 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
