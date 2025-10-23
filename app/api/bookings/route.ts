export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity, q_bookings_for_equipment_month, q_bookings_for_month_all_equipment } from "@/lib/sanity";

export async function GET(req: Request) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthStart = searchParams.get("monthStart");
  const monthEnd = searchParams.get("monthEnd");
  const all = searchParams.get("all");

  if (!monthStart || !monthEnd) {
    return NextResponse.json(
      { error: "missing_month_range" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Matrix view: all equipment this month
  if (all === "1") {
    const rows = await sanity.fetch(q_bookings_for_month_all_equipment, { monthStart, monthEnd });
    // console.log("[bookings GET all]", { monthStart, monthEnd, count: rows?.length });
    return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
  }

  // Calendar view: one equipment this month
  const eqId = searchParams.get("equipmentId");
  if (!eqId) {
    return NextResponse.json(
      { error: "missing_equipmentId" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rows = await sanity.fetch(q_bookings_for_equipment_month, { eqId, monthStart, monthEnd });
  // console.log("[bookings GET eq]", { eqId, monthStart, monthEnd, count: rows?.length });
  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { equipmentId, personId, startDate, endDate, note } = await req.json();

  if (!equipmentId || !personId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Conflict check (string compare; intervals overlap if start <= E && end >= S)
  const overlap = await sanity.fetch(
    `count(*[
      _type == "booking" &&
      references($eq) &&
      startDate <= $e &&
      endDate   >= $s
    ])`,
    { eq: equipmentId, s: startDate, e: endDate }
  );

  if (overlap > 0) {
    return NextResponse.json(
      { error: "conflict" },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  const doc = await sanity.create({
    _type: "booking",
    equipment: { _type: "reference", _ref: equipmentId },
    person: { _type: "reference", _ref: personId },
    startDate,
    endDate,
    note,
  });

  return NextResponse.json({ ok: true, id: doc._id }, { headers: { "Cache-Control": "no-store" } });
}
