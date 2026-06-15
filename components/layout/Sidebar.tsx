"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tv, Film, MonitorPlay, Search, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/live", label: "Live TV", icon: Tv },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/series", label: "Series", icon: MonitorPlay },
  { href: "/search", label: "Search", icon: Search },
  { href: "/favourites", label: "My List", icon: Heart },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-[84px] shrink-0 flex-col items-center gap-1 border-r border-white/5 bg-ink-950/60 py-6 backdrop-blur-xl lg:flex">
      <Link href="/" className="mb-6 flex flex-col items-center gap-1">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-soft to-amber-deep font-black text-ink-950 shadow-lg">
          L
        </span>
      </Link>
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "group relative flex w-full flex-col items-center gap-1 px-2 py-3 text-[10px] font-medium transition-colors",
              active ? "text-amber-glow" : "text-fog-500 hover:text-fog-300",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-amber-glow" />
            )}
            <Icon
              className={cn(
                "h-6 w-6 transition-transform group-hover:scale-110",
                active && "drop-shadow-[0_0_8px_rgba(232,176,75,0.5)]",
              )}
              strokeWidth={active ? 2.4 : 1.8}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </aside>
  );
}

/** Mobile bottom nav. */
export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/5 bg-ink-950/85 px-2 py-2 backdrop-blur-xl lg:hidden">
      {NAV.slice(0, 5).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px]",
              active ? "text-amber-glow" : "text-fog-500",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
