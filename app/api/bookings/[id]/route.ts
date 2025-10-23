export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity } from "@/lib/sanity";

// PATCH /api/bookings/[id]
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { id } = await ctx.params;                                 // 👈 await params
  const { startDate, endDate, note } = await req.json();

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Find which equipment this booking belongs to (for conflict checks)
  const current = await sanity.fetch(
    `*[_type=="booking" && _id==$id][0]{ equipment->{_id} }`,
    { id }
  );
  const eqId: string | undefined = current?.equipment?._id;
  if (!eqId) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Conflict check (string compare; exclude self)
  const overlap = await sanity.fetch(
    `count(*[
      _type=="booking" &&
      _id != $id &&
      references($eq) &&
      startDate <= $e &&
      endDate   >= $s
    ])`,
    { id, eq: eqId, s: startDate, e: endDate }
  );
  if (overlap > 0) {
    return NextResponse.json(
      { error: "conflict" },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  await sanity.patch(id).set({ startDate, endDate, note }).commit();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

// DELETE /api/bookings/[id]
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { id: raw } = await ctx.params;                            // 👈 await params
  const id = String(raw ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "missing_id" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Ensure the doc exists and is a booking
  const doc = await sanity.fetch(`*[_id==$id][0]{ _id, _type }`, { id });
  if (!doc) {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); // already gone
  }
  if (doc._type !== "booking") {
    return NextResponse.json(
      { error: "not_a_booking" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Delete (direct), with a safe fallback
  try {
    await sanity.delete(id);
  } catch {
    await sanity.delete({ query: `*[_type=="booking" && _id==$id]`, params: { id } } as any);
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
