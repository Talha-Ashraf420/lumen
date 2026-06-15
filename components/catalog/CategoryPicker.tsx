"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, LayoutGrid } from "lucide-react";
import type { Category } from "@/lib/xtream/types";
import { cn } from "@/lib/utils";

/** Glass combobox: a searchable, scrollable category list (replaces chip rows). */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string; // "all" | category_id
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current =
    value === "all" || !value
      ? "All categories"
      : categories.find((c) => c.category_id === value)?.category_name || "Category";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.category_name.toLowerCase().includes(q));
  }, [categories, query]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-w-[200px] items-center gap-2 rounded-full border border-white/10 bg-ink-850/80 px-4 py-2 text-sm font-medium transition-colors hover:border-iris-400/50",
          open && "border-iris-400/60",
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0 text-iris-400" />
        <span className="flex-1 truncate text-left">{current}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-fog-500 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 top-12 z-40 w-[300px] overflow-hidden rounded-2xl glass-bright shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-fog-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories…"
                className="w-full bg-transparent text-sm placeholder:text-fog-500 focus:outline-none"
              />
              {categories.length > 0 && (
                <span className="shrink-0 font-mono text-[10px] text-fog-500">{filtered.length}</span>
              )}
            </div>

            <div className="max-h-[min(60vh,360px)] overflow-y-auto p-1.5">
              <Row label="All categories" active={value === "all" || !value} onClick={() => pick("all")} />
              {filtered.map((c) => (
                <Row
                  key={c.category_id}
                  label={c.category_name}
                  active={value === c.category_id}
                  onClick={() => pick(c.category_id)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-fog-500">No matching categories.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-iris-400/15 text-iris-300" : "text-fog-300 hover:bg-white/10 hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      {active && <Check className="h-4 w-4 shrink-0 text-iris-400" />}
    </button>
  );
}
