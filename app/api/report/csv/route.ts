export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity, q_report_rows } from "@/lib/sanity";

function csvEscape(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const sess = await requireSession();
  if (!sess.ok) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  if (!start || !end) return new NextResponse("Missing date range", { status: 400 });

  const rows: any[] = await sanity.fetch(q_report_rows, { start, end });

  const header = ["Asset Number","Asset Name","Person","Start Date","End Date","Note (Purpose)"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push([
      csvEscape(r.assetNumber || ""),
      csvEscape(r.equipmentName || ""),
      csvEscape(r.personName || ""),
      csvEscape(r.startDate),
      csvEscape(r.endDate),
      csvEscape(r.note || "")
    ].join(","));
  }

  const body = lines.join("\n");
  const filename = `usage_${start}_to_${end}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
