// proxy.ts (root of the repo)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// You can either keep this as a default export or change to `export function proxy(...)`.
// We'll do both to be extra-compatible.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login/logout endpoints, the login page, Next assets and favicon
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Simple gate: if there's no session cookie, send to /login
  const has = req.cookies.get("nti_session")?.value;
  if (!has) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export default proxy;

// Optional: restrict which paths the proxy runs on (same style as old middleware)
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
