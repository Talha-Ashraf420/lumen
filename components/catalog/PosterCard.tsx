"use client";

import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { api } from "@/lib/api";
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
  index = 0,
}: {
  item: PosterItem;
  href: string;
  className?: string;
  index?: number;
}) {
  const rating = ratingNum(item.rating);
  const year = item.year || yearFrom(item.name);
  const meta = item.subtitle || year;
  const qc = useQueryClient();

  // Warm the detail data on hover so the page is instant when clicked.
  const prefetch = () => {
    const movie = href.match(/^\/movies\/(\d+)/);
    const series = href.match(/^\/series\/(\d+)/);
    if (movie) {
      qc.prefetchQuery({ queryKey: ["vod", "info", movie[1]], queryFn: () => api.vodInfo(movie[1]) });
    } else if (series) {
      qc.prefetchQuery({ queryKey: ["series", "info", series[1]], queryFn: () => api.seriesInfo(series[1]) });
    }
  };

  return (
    <Link
      href={href}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      className={cn("tilt-scene card-in group block focus:outline-none", className)}
      style={{ animationDelay: `${Math.min(index, 14) * 0.035}s` }}
    >
      <Tilt
        tiltMaxAngleX={9}
        tiltMaxAngleY={9}
        scale={1.06}
        transitionSpeed={500}
        glareEnable
        glareMaxOpacity={0.22}
        glareColor="#A6B0FF"
        glarePosition="all"
        glareBorderRadius="16px"
        className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/8 shadow-lg shadow-black/40 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-iris-400/25 group-hover:ring-iris-400/40 group-focus-visible:focus-ring"
      >
        <SmartImage
          src={item.poster}
          alt={item.name}
          rounded="rounded-none"
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
        />

        {/* base scrim for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/15 to-transparent" />
        {/* hover wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-iris-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {rating > 0 && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-ink-950/55 px-1.5 py-0.5 text-[11px] font-semibold text-mint-300 backdrop-blur-md ring-1 ring-white/10">
            <Star className="h-3 w-3 fill-mint-300" /> {rating.toFixed(1)}
          </span>
        )}

        {/* play pill on hover */}
        <span
          className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass-bright opacity-0 transition-all duration-300 group-hover:opacity-100"
          style={{ transform: "translate(-50%, -50%) translateZ(50px)" }}
        >
          <Play className="h-6 w-6 translate-x-0.5 fill-iris-300 text-iris-300" />
        </span>

        {/* title overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3" style={{ transform: "translateZ(30px)" }}>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground drop-shadow">
            {cleanName(item.name)}
          </p>
          {meta && <p className="mt-0.5 truncate text-[11px] text-fog-400">{meta}</p>}
        </div>

        {item.progress !== undefined && item.progress > 0 && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-ink-950/60">
            <span className="block h-full bg-iris-400" style={{ width: `${Math.min(100, item.progress * 100)}%` }} />
          </span>
        )}
      </Tilt>
    </Link>
  );
}
