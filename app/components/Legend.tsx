"use client";

import { bestTextColor } from "@/lib/contrast";

type Person = {
  _id: string;
  fullName: string;
  initials: string;
  color: string; // can be hex, rgb/rgba, hsl/hsla, or named color
};

export default function Legend({ people }: { people: Person[] }) {
  return (
    <div className="legend legend--inline">
      {people.map((p) => {
        const bg = p.color || "#777";
        const fg = bestTextColor(bg);

        return (
          <div key={p._id} className="legend__item" title={p.fullName}>
            <span
              className="legend__circle"
              style={{ background: bg, color: fg }}
              aria-label={p.fullName}
            >
              {p.initials}
            </span>
            <span>{p.fullName}</span>
          </div>
        );
      })}
    </div>
  );
}
