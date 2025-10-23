"use client";

import { useEffect, useMemo, useState } from "react"; 
import "../styles/calendar.scss";
import { ymd, daysInView, firstOfMonth, lastOfMonth, addDays } from "@/lib/date";
import { bestTextColor } from "@/lib/contrast";


type Booking = {
  _id: string;
  startDate: string;
  endDate: string;
  note?: string;
  person: { _id: string; fullName: string; initials: string; color: string };
  equipment?: { _id: string; name: string };
};

export default function Calendar({
  month,
  onMonthChange,
  equipmentId,
  onPickRange,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  equipmentId: string;
  onPickRange: (s: string, e: string) => void;
}) {
  const [rows, setRows] = useState<Booking[]>([]);
  const [selStart, setSelStart] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams({
        equipmentId,
        monthStart: ymd(firstOfMonth(month)),
        monthEnd: ymd(lastOfMonth(month)),
      });
      const data = await fetch(`/api/bookings?${qs}`, { cache: "no-store" }).then((r) => r.json());
      console.log(data)
      setRows(data);
    })();
  }, [month, equipmentId]);

  const bookedMap = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    rows.forEach((b) => {
      let d = new Date(b.startDate);
      const end = new Date(b.endDate);
      while (d <= end) {
        const key = ymd(d);
        (map[key] ||= []).push(b);
        d = addDays(d, 1);
      }
    });
    return map;
  }, [rows]);

  const view = daysInView(month);

  function clickDay(d: string) {
    const disabled = (bookedMap[d]?.length ?? 0) > 0;
    if (disabled) return;
    if (!selStart) {
      setSelStart(d);
      return;
    }
    const start = selStart < d ? selStart : d;
    const end = selStart < d ? d : selStart;
    onPickRange(start, end);
    setSelStart(null);
  }

  function prev() { onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }
  function next() { onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }

  

  return (
    <div className="cal">
      <div className="cal__bar">
        <button onClick={prev}>&lt; Prev</button>
        <h3>{month.toLocaleString(undefined, { month: "long" })}, {month.getFullYear()}</h3>
        <button onClick={next}>Next &gt;</button>
      </div>

      <div className="cal__head">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="cal__dow">{d}</div>
        ))}
      </div>

      <div className="cal__grid">
        {view.days.map((d, i) => {
          const key = ymd(d);
          const isThisMonth = d.getMonth() === month.getMonth();
          const booked = bookedMap[key]?.[0];
          const disabled = !!booked;
          const isSelStart = selStart === key;
          const bg = booked?.person?.color || "#777";
          const fg = bestTextColor(bg);

          return (
            <div
              key={i}
              className={`cal__cell${isThisMonth ? "" : " is-faded"}${disabled ? " is-booked" : ""}${isSelStart ? " is-start" : ""}`}
              onClick={() => clickDay(key)}
              onContextMenu={(e) => {
                e.preventDefault();
                const b = bookedMap[key]?.[0];
                if (b) {
                  const ev = new CustomEvent("open-booking-context", { detail: b });
                  window.dispatchEvent(ev);
                }
              }}
            >
              <div className="cal__date">{d.getDate()}</div>
              {booked && (
                <div
                  className="cal__badge"
                  title={`${booked.person.fullName}${booked.note ? `\n${booked.note}` : ""}`}
                  style={{ background: bg, color: fg }}
                >
                  {booked.person.initials}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
