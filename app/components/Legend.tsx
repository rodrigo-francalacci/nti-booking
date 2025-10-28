"use client";
import { bestTextColor } from "@/lib/contrast";

export default function Legend({
  people,
  stacked = false,
}: {
  people: Array<{ _id: string; fullName: string; initials: string; color: string }>;
  stacked?: boolean;
}) {
  return (
    <div className={`legend ${stacked ? "legend--stack" : "legend--inline"}`}>
      {people.map((p) => {
        const fg = bestTextColor(p.color);
        return (
          <div key={p._id} className="legend__item" title={p.fullName}>
            <span className="legend__circle" style={{ background: p.color, color: fg }}>
              {p.initials}
            </span>
            <span className="legend__name">{p.fullName}</span>
          </div>
        );
      })}
    </div>
  );
}
