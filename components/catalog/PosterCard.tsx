"use client";

import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { Play, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cleanName, ratingNum, yearFrom, cn } from "@/lib/utils";

export interface PosterItem {
  id: string | number;
  name: string;
  poster?: string;
  rating?: string | number;
  year?: string;
  subtitle?: string;
  progress?: number; // 0..1
}

export function PosterCard({
  item,
  href,
  className,
}: {
  item: PosterItem;
  href: string;
  className?: string;
}) {
  const rating = ratingNum(item.rating);
  const year = item.year || yearFrom(item.name);

  return (
    <Link href={href} className={cn("tilt-scene group block focus:outline-none", className)}>
      <Tilt
        tiltMaxAngleX={8}
        tiltMaxAngleY={8}
        scale={1.05}
        transitionSpeed={500}
        glareEnable
        glareMaxOpacity={0.18}
        glareColor="#A6B0FF"
        glarePosition="all"
        glareBorderRadius="14px"
        className="relative overflow-hidden rounded-[--radius-card] bg-ink-850 shadow-lg shadow-black/40 ring-1 ring-white/5 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-iris-400/20 group-focus-visible:focus-ring"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <SmartImage src={item.poster} alt={item.name} rounded="rounded-none" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent opacity-80" />

          {rating > 0 && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-ink-950/70 px-1.5 py-0.5 text-[11px] font-semibold text-iris-300 backdrop-blur">
              <Star className="h-3 w-3 fill-iris-300" /> {rating.toFixed(1)}
            </span>
          )}

          <span
            className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ transform: "translateZ(40px)" }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-iris-400 text-ink-950 shadow-lg shadow-iris-400/40">
              <Play className="h-5 w-5 translate-x-0.5 fill-ink-950" />
            </span>
          </span>

          {item.progress !== undefined && item.progress > 0 && (
            <span className="absolute inset-x-0 bottom-0 h-1 bg-ink-950/60">
              <span className="block h-full bg-iris-400" style={{ width: `${Math.min(100, item.progress * 100)}%` }} />
            </span>
          )}
        </div>

        <div className="px-2.5 pb-3 pt-2">
          <p className="truncate text-sm font-medium text-foreground">{cleanName(item.name)}</p>
          <p className="truncate text-xs text-fog-500">{item.subtitle || year || " "}</p>
        </div>
      </Tilt>
    </Link>
  );
}
