"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal scrolling row with hover arrows. */
export function Shelf({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className={cn("group/shelf relative", className)}>
      <h2 className="mb-3 px-5 text-lg font-semibold tracking-tight sm:px-8">{title}</h2>
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-ink-950 to-transparent text-foreground opacity-0 transition-opacity group-hover/shelf:opacity-100 lg:flex"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <div
          ref={ref}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-px-5 px-5 sm:px-8"
        >
          {children}
        </div>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-ink-950 to-transparent text-foreground opacity-0 transition-opacity group-hover/shelf:opacity-100 lg:flex"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
    </section>
  );
}
