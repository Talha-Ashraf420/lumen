import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optional site-wide HTTP Basic auth for public deployments.
 * Enabled only when SITE_PASSWORD is set (so local dev is unaffected).
 * Set SITE_PASSWORD (and optionally SITE_USER) in your host's env vars.
 */
export function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next(); // protection disabled

  const user = process.env.SITE_USER || "lumen";
  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const [u, p] = atob(header.slice(6)).split(":");
      if (u === user && p === password) return NextResponse.next();
    } catch {
      // fall through to challenge
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Lumen", charset="UTF-8"' },
  });
}

export const config = {
  // protect everything except static assets & icons
  matcher: ["/((?!_next/static|_next/image|icon.svg|logo.svg|favicon.ico).*)"],
};
