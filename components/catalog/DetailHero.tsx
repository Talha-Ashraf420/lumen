"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";

/** Shared cinematic detail header used by movie + series pages. */
export function DetailHero({
  backdrop,
  poster,
  title,
  children,
  fav,
  onToggleFav,
}: {
  backdrop?: string;
  poster?: string;
  title: string;
  children: React.ReactNode;
  fav?: boolean;
  onToggleFav?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[70vh] overflow-hidden">
        <SmartImage src={backdrop || poster} alt={title} rounded="rounded-none" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-full glass px-3.5 py-2 text-sm font-medium hover:bg-ink-700/70"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {onToggleFav && (
          <button
            onClick={onToggleFav}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full glass transition-colors",
              fav ? "text-iris-400" : "text-fog-300 hover:text-foreground",
            )}
            aria-label="Toggle favourite"
          >
            <Heart className={cn("h-5 w-5", fav && "fill-iris-400")} />
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-5 pt-24 sm:flex-row sm:px-8 sm:pt-40">
        <div className="hidden w-44 shrink-0 sm:block">
          <SmartImage src={poster} alt={title} className="aspect-[2/3] w-44 shadow-2xl" />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
