export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/cookies";
import { sanity } from "@/lib/sanity";

// GET /api/bookings/summary?equipmentId=...&date=YYYY-MM-DD
export async function GET(req: Request) {
  const sess = await requireSession();
  if (!sess.ok) return NextResponse.json({ error: "401" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId") || "";
  const date = searchParams.get("date") || "";
  if (!equipmentId || !date) {
    return NextResponse.json(
      { error: "missing_params" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // string-based date comparisons; no timezones
  const [current, last, next] = await Promise.all([
    sanity.fetch(
      `*[_type=="booking" && references($eq) && startDate <= $d && endDate >= $d][0]{
        _id,startDate,endDate,note,
        person->{_id,fullName,initials,color,location}
      }`,
      { eq: equipmentId, d: date }
    ),
    sanity.fetch(
      `*[_type=="booking" && references($eq) && endDate < $d]
        | order(endDate desc)[0]{
        _id,startDate,endDate,
        person->{_id,fullName,initials,color,location}
      }`,
      { eq: equipmentId, d: date }
    ),
    sanity.fetch(
      `*[_type=="booking" && references($eq) && startDate > $d]
        | order(startDate asc)[0]{
        _id,startDate,endDate,
        person->{_id,fullName,initials,color,location}
      }`,
      { eq: equipmentId, d: date }
    ),
  ]);

  return NextResponse.json({ current, last, next }, { headers: { "Cache-Control": "no-store" } });
}
