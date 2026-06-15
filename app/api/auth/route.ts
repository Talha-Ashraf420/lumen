import { NextResponse } from "next/server";
import { authenticate, XtreamError } from "@/lib/xtream/client";
import { normalizeBaseUrl } from "@/lib/xtream/urls";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/session";

export const runtime = "nodejs";

/** POST { baseUrl, username, password } → validate + set session cookie. */
export async function POST(req: Request) {
  let body: { baseUrl?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const baseUrl = normalizeBaseUrl(body.baseUrl ?? "");
  const username = (body.username ?? "").trim();
  const password = (body.password ?? "").trim();

  if (!baseUrl || !username || !password) {
    return NextResponse.json(
      { error: "Server URL, username and password are all required." },
      { status: 400 },
    );
  }

  try {
    const auth = await authenticate({ baseUrl, username, password });
    await setSessionCookie({ baseUrl, username, password });
    return NextResponse.json({ ok: true, user_info: auth.user_info, server_info: auth.server_info });
  } catch (err) {
    const status = err instanceof XtreamError && err.status ? err.status : 401;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Authentication failed" },
      { status },
    );
  }
}

/** GET → current session account info (re-validates against provider). */
export async function GET() {
  const creds = await getSession();
  if (!creds) return NextResponse.json({ authenticated: false }, { status: 200 });
  try {
    const auth = await authenticate(creds);
    return NextResponse.json({
      authenticated: true,
      baseUrl: creds.baseUrl,
      username: creds.username,
      user_info: auth.user_info,
      server_info: auth.server_info,
    });
  } catch {
    return NextResponse.json({ authenticated: true, baseUrl: creds.baseUrl, username: creds.username });
  }
}

/** DELETE → logout. */
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
