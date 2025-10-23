export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity, q_equipment_all } from "@/lib/sanity";

export async function GET() {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const equipments = await sanity.fetch(q_equipment_all);
  return NextResponse.json(equipments, { headers: { "Cache-Control": "no-store" } });
}
