"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Provider poster/logo images are often dead links or mixed-content http.
 * SmartImage falls back to a tasteful gradient tile with initials.
 */
export function SmartImage({
  src,
  alt,
  className,
  rounded = "rounded-[--radius-card]",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const clean = src && src.trim() && src !== "null" ? src : null;

  if (!clean || failed) {
    const initials = alt
      .replace(/^[\s|]*[A-Z]{2,4}[\s|:-]+/, "")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-850 text-fog-400",
          rounded,
          className,
        )}
        aria-label={alt}
      >
        <span className="text-lg font-semibold tracking-wide select-none">{initials || "?"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={clean}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover bg-ink-800", rounded, className)}
    />
  );
}
