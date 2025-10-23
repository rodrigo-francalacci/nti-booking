export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { sanity, q_active_people } from "@/lib/sanity";
import { requireSession } from "@/lib/cookies";

export async function GET() {
  const sess = await requireSession();                 // <— await
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const people = await sanity.fetch(q_active_people);
  return NextResponse.json(people, { headers: { "Cache-Control": "no-store" } });
}
