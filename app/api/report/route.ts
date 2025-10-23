export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity, q_report_rows } from "@/lib/sanity";

export async function GET(req: Request) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  if (!start || !end) {
    return NextResponse.json({ error: "missing_range" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const rows = await sanity.fetch(q_report_rows, { start, end });
  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}
