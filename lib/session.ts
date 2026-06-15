import { cookies } from "next/headers";
import type { XtreamCredentials } from "./xtream/types";

const COOKIE = "lumen_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Credentials are kept in an httpOnly cookie so the provider username/password
 * never touch client JS. This is a local, single-user app — the cookie is the
 * source of truth for the server-side proxy. Not encrypted (runs on localhost).
 */
export async function setSessionCookie(creds: XtreamCredentials): Promise<void> {
  const jar = await cookies();
  const value = Buffer.from(JSON.stringify(creds), "utf8").toString("base64");
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<XtreamCredentials | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const creds = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as XtreamCredentials;
    if (creds.baseUrl && creds.username && creds.password) return creds;
    return null;
  } catch {
    return null;
  }
}

/** Throws a tagged error when there is no session (used by API routes). */
export async function requireSession(): Promise<XtreamCredentials> {
  const creds = await getSession();
  if (!creds) {
    const err = new Error("Not authenticated");
    (err as Error & { code: string }).code = "NO_SESSION";
    throw err;
  }
  return creds;
}
