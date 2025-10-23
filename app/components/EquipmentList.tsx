"use client";

import { useEffect, useState } from "react";
import { ymd } from "@/lib/date";
import "../styles/equipment.scss";

type Item = { _id: string; name: string };

type Summary = {
  current?: {
    _id: string;
    person?: { fullName?: string; location?: string };
  } | null;
  last?: {
    endDate?: string;
    person?: { fullName?: string; location?: string };
  } | null;
  next?: {
    startDate?: string;
    person?: { fullName?: string; location?: string };
  } | null;
};

export default function EquipmentList({
  items,
  selectedId,
  onSelect,
}: {
  items: Item[];
  selectedId?: string;
  onSelect: (i: Item) => void;
}) {
  const [summary, setSummary] = useState<Record<string, Summary>>({});

  useEffect(() => {
    if (!items?.length) return;
    (async () => {
      const today = ymd(new Date());
      const map: Record<string, Summary> = {};
      // fetch in parallel but politely (sequential is fine too)
      await Promise.all(
        items.map(async (it) => {
          const qs = new URLSearchParams({ equipmentId: it._id, date: today });
          const data = await fetch(`/api/bookings/summary?${qs}`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({}));
          map[it._id] = data || {};
        })
      );
      setSummary(map);
    })();
  }, [items]);

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  return (
    <div className="equip">
      {items.map((it) => {
        const s = summary[it._id] || {};
        const inUse = !!s.current;
        const who = s.current?.person?.fullName;
        const where = s.current?.person?.location;

        const lastLine =
          !inUse && s.last?.person?.fullName
            ? `Last used by ${s.last.person.fullName}${s.last.person.location ? ` · ${s.last.person.location}` : ""} on ${fmt(
                s.last.endDate
              )}`
            : !inUse
            ? "No previous usage"
            : "";

        const nextLine =
          s.next?.person?.fullName
            ? `Next: ${fmt(s.next.startDate)} by ${s.next.person.fullName}`
            : "No upcoming bookings";

        return (
          <button
            key={it._id}
            className={`equip__card${selectedId === it._id ? " is-selected" : ""}${inUse ? " is-busy" : ""}`}
            onClick={() => onSelect(it)}
          >
            <div className="equip__name">{it.name}</div>

            <div className="equip__meta">
              {inUse ? (
                <>
                  <span className="tag tag--busy">In use</span>
                  <span className="muted"> by {who} · {where || "No location"}</span>
                </>
              ) : (
                <>
                  <span className="tag tag--ok">Available</span>
                  <div className="equip__sub">{lastLine}</div>
                </>
              )}
              <div className="equip__sub">{nextLine}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
