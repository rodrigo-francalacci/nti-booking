// lib/date.ts
// All helpers are LOCAL time (no UTC conversions).

export function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // e.g. "2025-10-22"
}

export function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function lastOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addDays(d: Date, n: number) {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
}

// Calendar view helper: returns the full grid range (Mon–Sun rows)
export function daysInView(month: Date) {
  const first = firstOfMonth(month);
  const last = lastOfMonth(month);

  // Start from Monday of the first week shown
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));

  // End on Sunday of the last week shown
  const end = new Date(last);
  end.setDate(last.getDate() + (7 - ((last.getDay() + 6) % 7) - 1));

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(new Date(d));
  return { start, end, days };
}
