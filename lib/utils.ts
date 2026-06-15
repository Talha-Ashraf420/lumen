export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Parse "HH:MM:SS" / "MM:SS" / "123 min" / number into seconds. */
export function parseDurationToSeconds(v?: string | number): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const s = v.trim();
  if (/^\d+$/.test(s)) return Number(s);
  const clock = s.match(/(\d+):(\d{1,2})(?::(\d{1,2}))?/);
  if (clock) {
    const a = Number(clock[1]);
    const b = Number(clock[2]);
    const c = clock[3] ? Number(clock[3]) : null;
    return c !== null ? a * 3600 + b * 60 + c : a * 60 + b;
  }
  const min = s.match(/(\d+)\s*min/i);
  if (min) return Number(min[1]) * 60;
  return 0;
}

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Extract a 4-digit year from a free-form title or date string. */
export function yearFrom(...vals: Array<string | undefined>): string {
  for (const v of vals) {
    if (!v) continue;
    const m = v.match(/(19|20)\d{2}/);
    if (m) return m[0];
  }
  return "";
}

export function ratingNum(r?: string | number): number {
  if (r === undefined || r === null) return 0;
  const n = typeof r === "number" ? r : parseFloat(r);
  return isNaN(n) ? 0 : n;
}

export type SortKey = "az" | "za" | "added" | "year" | "rating";

export const SORT_LABELS: Record<SortKey, string> = {
  az: "A → Z",
  za: "Z → A",
  added: "Recently Added",
  year: "Year",
  rating: "Top Rated",
};

interface Sortable {
  name: string;
  added?: string;
  last_modified?: string;
  rating?: string | number;
  releaseDate?: string;
  release_date?: string;
}

export function sortItems<T extends Sortable>(items: T[], key: SortKey): T[] {
  const copy = [...items];
  switch (key) {
    case "az":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "za":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "added":
      return copy.sort(
        (a, b) => Number(b.added ?? b.last_modified ?? 0) - Number(a.added ?? a.last_modified ?? 0),
      );
    case "year":
      return copy.sort(
        (a, b) =>
          Number(yearFrom(a.releaseDate, a.release_date, a.name) || 0) -
          Number(yearFrom(b.releaseDate, b.release_date, b.name) || 0),
      ).reverse();
    case "rating":
      return copy.sort((a, b) => ratingNum(b.rating) - ratingNum(a.rating));
    default:
      return copy;
  }
}

/** Strip leading category tags some providers prefix, e.g. "|US| HBO". */
export function cleanName(name: string): string {
  return name.replace(/^[\s|]*[A-Z]{2,4}[\s|:-]+/, "").trim() || name;
}
