export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { sign } from "@/lib/auth";
import { setSessionCookie } from "@/lib/cookies";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password as string | undefined;
    console.log("[env] APP_PASSWORD length:", process.env.APP_PASSWORD?.length);


    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + 60 * 60 * 12; // 12h session
    const token = sign({ iat: nowSec, exp }, process.env.APP_SESSION_SECRET!);

    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookie(res, token, 60 * 60 * 12);
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
