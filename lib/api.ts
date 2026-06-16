// Client-side fetchers — all same-origin, hitting our proxy routes.
import type {
  AuthResponse,
  Category,
  LiveStream,
  VodStream,
  VodInfo,
  Series,
  SeriesInfo,
  EpgListing,
  StreamKind,
} from "./xtream/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

const x = (action: string, params: Record<string, string | number | undefined> = {}) => {
  const sp = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  return `/api/xtream?${sp.toString()}`;
};

export const api = {
  // auth
  session: () =>
    getJson<{
      authenticated: boolean;
      baseUrl?: string;
      username?: string;
      user_info?: AuthResponse["user_info"];
      server_info?: AuthResponse["server_info"];
    }>("/api/auth"),

  login: async (baseUrl: string, username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl, username, password }),
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Login failed");
    return data as { ok: true; user_info: AuthResponse["user_info"]; server_info: AuthResponse["server_info"] };
  },

  logout: () => fetch("/api/auth", { method: "DELETE", credentials: "same-origin" }),

  // catalog
  liveCategories: () => getJson<Category[]>(x("get_live_categories")),
  liveStreams: (categoryId?: string) => getJson<LiveStream[]>(x("get_live_streams", { category_id: categoryId })),
  vodCategories: () => getJson<Category[]>(x("get_vod_categories")),
  vodStreams: (categoryId?: string) => getJson<VodStream[]>(x("get_vod_streams", { category_id: categoryId })),
  vodInfo: (id: string | number) => getJson<VodInfo>(x("get_vod_info", { vod_id: id })),
  seriesCategories: () => getJson<Category[]>(x("get_series_categories")),
  series: (categoryId?: string) => getJson<Series[]>(x("get_series", { category_id: categoryId })),
  seriesInfo: (id: string | number) => getJson<SeriesInfo>(x("get_series_info", { series_id: id })),

  // epg (decoded)
  epg: (streamId: string | number, limit = 8) =>
    getJson<{ epg_listings: EpgListing[] }>(`/api/epg?stream_id=${streamId}&limit=${limit}`),

  // free TV (public iptv-org lists)
  freeTvCategories: () =>
    getJson<{ categories: Array<{ id: string; name: string }> }>("/api/freetv?list=categories"),
  freeTvCountries: () =>
    getJson<{ countries: Array<{ id: string; name: string }> }>("/api/freetv?list=countries"),
  freeTvChannels: (mode: "cat" | "country", value: string) =>
    getJson<{ channels: FreeChannel[] }>(
      `/api/freetv?${mode === "country" ? "country" : "category"}=${encodeURIComponent(value)}`,
    ),
};

export interface FreeChannel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
}

/** Same-origin HLS player URL for a public free-TV stream. */
export function freeTvSrc(m3u8Url: string): string {
  return `/api/hls?u=${encodeURIComponent(m3u8Url)}`;
}

/** Same-origin proxied media URL (used for live, and as a VOD fallback). */
export function streamSrc(kind: StreamKind, id: string | number, ext = "ts"): string {
  return `/api/stream?type=${kind}&id=${id}&ext=${encodeURIComponent(ext)}`;
}

/** ffmpeg remux URL — fallback for browser-unplayable containers (mkv/avi/…). */
export function transcodeSrc(kind: StreamKind, id: string | number, ext: string): string {
  return `/api/transcode?type=${kind}&id=${id}&ext=${encodeURIComponent(ext)}`;
}

/** Resolve the direct provider URL + whether direct browser playback is viable. */
export async function resolveSrc(
  kind: StreamKind,
  id: string | number,
  ext: string,
): Promise<{ url: string | null; directOk: boolean }> {
  try {
    const res = await fetch(`/api/resolve?type=${kind}&id=${id}&ext=${encodeURIComponent(ext)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return { url: null, directOk: false };
    const { url, directOk } = await res.json();
    return { url: url ?? null, directOk: !!directOk };
  } catch {
    return { url: null, directOk: false };
  }
}
