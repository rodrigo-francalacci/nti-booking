"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/matrix.scss";
import { firstOfMonth, lastOfMonth, addDays, ymd } from "@/lib/date";

type Equipment = { _id: string; name: string };

export default function AvailabilityMatrix({
  month,
  equipment
}: {
  month: Date;
  equipment: Equipment[];
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [nameCol, setNameCol] = useState<number>(180);
  const tableRef = useRef<HTMLDivElement>(null);

  // fetch bookings for the month
  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams({
        monthStart: ymd(firstOfMonth(month)),
        monthEnd: ymd(lastOfMonth(month)),
      });
      const data = await fetch(`/api/bookings?${qs}&all=1`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []);
      setRows(data || []);
    })();
  }, [month]);

  // map eqId -> { 'YYYY-MM-DD': true }
  const map = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};
    rows.forEach((b: any) => {
      let d = new Date(b.startDate);
      const end = new Date(b.endDate);
      const eq = b.equipment._id;
      (out[eq] ||= {});
      while (d <= end) {
        out[eq][ymd(d)] = true;
        d = addDays(d, 1);
      }
    });
    return out;
  }, [rows]);

  // days for the current month
  const start = firstOfMonth(month);
  const last = lastOfMonth(month);
  const days: string[] = [];
  for (let d = new Date(start); d <= last; d = addDays(d, 1)) days.push(ymd(d));

  // 👇 measure widest equipment name and set --mx-namew
  useEffect(() => {
    const measure = () => {
      const container = tableRef.current;
      if (!container) return;
      const nodes = container.querySelectorAll<HTMLElement>(".matrix__name");
      let w = 0;
      nodes.forEach((n) => (w = Math.max(w, Math.ceil(n.getBoundingClientRect().width))));
      // include cell padding + divider
      const pad = 24;
      // cap width on smaller screens so days still have room
      const cap = window.innerWidth < 380 ? 140 : window.innerWidth < 520 ? 160 : 220;
      const min = 100;
      if (w > 0) setNameCol(Math.max(min, Math.min(cap, w + pad)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (tableRef.current) ro.observe(tableRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [equipment]);

  const nameVar = { ["--mx-namew" as any]: `${nameCol}px` };

  return (
    <div className="matrix">
      <div className="matrix__legend">
        <span className="dot dot--ok"></span> Available
        <span className="dot dot--no"></span> Booked
      </div>

      <div className="matrix__table" ref={tableRef}>
        <div className="matrix__head" style={nameVar}>
          <div className="matrix__cell matrix__cell--rowhead"></div>
          {days.map((d) => (
            <div key={d} className="matrix__cell matrix__cell--head">
              {new Date(d).toLocaleDateString(undefined, { weekday: "short" })}<br />{new Date(d).getDate()}
            </div>
          ))}
        </div>

        {(equipment || []).map((eq) => (
          <div key={eq._id} className="matrix__row" style={nameVar}>
            <div className="matrix__cell matrix__cell--rowhead">
              <span className="matrix__name">{eq.name}</span>
            </div>
            {days.map((d) => (
              <div key={d} className="matrix__cell">
                <span className={`dot ${map[eq._id]?.[d] ? "dot--no" : "dot--ok"}`}></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
