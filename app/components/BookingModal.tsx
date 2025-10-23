"use client";

import { useEffect, useState } from "react";
import { useBusy } from "../components/BusyProvider";
import "../styles/legend.scss";

type Person = { _id: string; fullName: string; initials: string; color: string };
type Equipment = { _id: string; name: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export default function BookingModal({
  mode,
  booking,
  people,
  equipment,
  startDate,
  endDate,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  booking?: any | null;
  people: Person[];
  equipment: Equipment | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { withBusy } = useBusy();

  const [personId, setPersonId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [sDate, setSDate] = useState<string>(startDate);
  const [eDate, setEDate] = useState<string>(endDate);

  useEffect(() => {
    setSDate(startDate);
    setEDate(endDate);
    setNote(booking?.note || "");
    if (mode === "edit" && booking?.person?._id) setPersonId(booking.person._id);
  }, [mode, booking, startDate, endDate]);

  function validateRange() {
    if (!sDate || !eDate) return (alert("Please pick both start and end dates."), false);
    if (sDate > eDate)   return (alert("Start date cannot be after end date."), false);
    return true;
  }

  async function save() {
    if (!validateRange()) return;

    await withBusy(async () => {
      await nextFrame(); // ✅ let overlay paint

      if (mode === "create") {
        if (!equipment?._id) return alert("Missing equipment.");
        if (!personId) return alert("Please select a person.");

        const r = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId: equipment._id,
            personId,
            startDate: sDate,
            endDate: eDate,
            note,
          }),
        });
        if (r.status === 409) return alert("Those dates clash with an existing booking for this equipment.");
        if (!r.ok) return alert("Could not save.");
      } else {
        if (!booking?._id) return alert("Missing booking id.");
        const r = await fetch(`/api/bookings/${booking._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: sDate, endDate: eDate, note }),
        });
        if (r.status === 409) return alert("Those dates clash with an existing booking.");
        if (!r.ok) return alert("Could not update booking.");
      }

      onSaved();
      await sleep(300);   // ✅ linger a bit more
      location.reload();
    }, mode === "create" ? "Creating booking…" : "Saving changes…");
  }

    async function remove() {
      if (!booking?._id) return;

      await withBusy(async () => {
        await nextFrame(); // let the overlay paint
        const r = await fetch(`/api/bookings/${booking._id}`, { method: "DELETE" });
        if (!r.ok) return alert("Could not delete booking.");
        onSaved();
        await sleep(300);   // linger a bit for smooth UI update
        location.reload();
      }, "Deleting booking…");
    }


  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "create" ? `Book ${equipment?.name}` : `Edit booking`}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0" }}>
          <div>
            <label>Start date</label>
            <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} />
          </div>
          <div>
            <label>End date</label>
            <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} />
          </div>
        </div>

        {mode === "create" ? (
          <div className="legend">
            {people.map((p) => (
              <label key={p._id} className="legend__item">
                <input
                  type="radio"
                  name="who"
                  value={p._id}
                  checked={personId === p._id}
                  onChange={() => setPersonId(p._id)}
                />
                <span className="legend__dot" style={{ background: p.color }}></span>
                <span>{p.fullName}</span>
              </label>
            ))}
          </div>
        ) : (
          <div style={{ margin: "8px 0 12px", color: "#445" }}>
            <b>Assigned to:</b> {booking?.person?.fullName}
          </div>
        )}

        <label>Purpose / note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />

        <div className="modal__row">
          {mode === "edit" && <button onClick={remove} className="danger">Delete</button>}
          <button onClick={save} disabled={mode === "create" && !personId}>Save</button>
          <button onClick={onClose} className="ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}
