import type { XtreamCredentials, StreamKind } from "./types";

/** Normalize a user-entered base URL: ensure scheme, strip trailing slash + any path. */
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = "http://" + url;
  // Drop everything after the host:port (people often paste full player_api URLs).
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

export function playerApiUrl(
  creds: XtreamCredentials,
  params: Record<string, string | number | undefined> = {},
): string {
  const u = new URL(`${creds.baseUrl}/player_api.php`);
  u.searchParams.set("username", creds.username);
  u.searchParams.set("password", creds.password);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  }
  return u.toString();
}

/** Build the real media URL on the provider for a given stream. */
export function buildStreamUrl(
  creds: XtreamCredentials,
  kind: StreamKind,
  id: string | number,
  ext = "ts",
): string {
  const { baseUrl, username, password } = creds;
  const safeExt = ext.replace(/^\./, "");
  if (kind === "live") return `${baseUrl}/live/${username}/${password}/${id}.${safeExt}`;
  if (kind === "movie") return `${baseUrl}/movie/${username}/${password}/${id}.${safeExt}`;
  return `${baseUrl}/series/${username}/${password}/${id}.${safeExt}`;
}

/** XMLTV full EPG endpoint (optional, large). */
export function xmltvUrl(creds: XtreamCredentials): string {
  const u = new URL(`${creds.baseUrl}/xmltv.php`);
  u.searchParams.set("username", creds.username);
  u.searchParams.set("password", creds.password);
  return u.toString();
}
