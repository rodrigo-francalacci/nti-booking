import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verify } from "./auth";

const SESSION = "nti_session";

export function setSessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,   // stays false on http://localhost
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION, "", { path: "/", maxAge: 0 });
}

// ✅ make it async and await cookies()
export async function requireSession() {
  const store = await cookies();                 // <— changed
  const token = store.get(SESSION)?.value;
  if (!token) return { ok: false as const };
  return verify(token, process.env.APP_SESSION_SECRET!);
}
