// Server-side TMDB client. Browse layer for instant, paginated discovery
// (vs the slow, unpaginated Xtream catalog). Key stays server-side.

const BASE = "https://api.themoviedb.org/3";

export function tmdbEnabled(): boolean {
  return !!(process.env.TMDB_BEARER || process.env.TMDB_API_KEY);
}

export async function tmdb<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const bearer = process.env.TMDB_BEARER;
  const apiKey = process.env.TMDB_API_KEY;
  if (!bearer && !apiKey) throw new Error("TMDB not configured");

  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  if (apiKey && !bearer) url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

/** Allow-list of TMDB paths the client proxy may call. */
export function isAllowedPath(path: string): boolean {
  return /^(trending|movie|tv|discover|search|genre)\//.test(path) || path === "configuration";
}
