"use client";

import { useEffect, useState } from "react";
import EquipmentList from "./components/EquipmentList";
import Calendar from "./components/Calendar";
import BookingModal from "./components/BookingModal";
import Legend from "./components/Legend";
import AvailabilityMatrix from "./components/AvailabilityMatrix";
import ContextMenu from "./components/ContextMenu";
import "@/app/globals.scss";

type Person = { _id: string; fullName: string; initials: string; color: string; location?: string; };
type Equipment = { _id: string; name: string; assetNumber?: string; serialNumber?: string; calibrationDueAt?: string; };
type ViewMode = "calendar" | "matrix";

export default function AppPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [month, setMonth] = useState(new Date());
  const [createModal, setCreateModal] = useState<{ start: string; end: string } | null>(null);
  const [view, setView] = useState<ViewMode>(() => (typeof window === "undefined" ? "calendar" : (localStorage.getItem("nti.view") as ViewMode) || "calendar"));
  useEffect(() => localStorage.setItem("nti.view", view), [view]);

  useEffect(() => {
    (async () => {
      const [p, e] = await Promise.all([
        fetch("/api/people", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/equipment", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setPeople(p);
      setEquipment(e);
      setSelectedEquipment((prev) => prev ?? (e?.[0] ?? null));
    })();
  }, []);

  const [editBooking, setEditBooking] = useState<any | null>(null);
  useEffect(() => {
    const h = (ev: Event) => setEditBooking((ev as CustomEvent).detail);
    window.addEventListener("edit-booking", h as any);
    return () => window.removeEventListener("edit-booking", h as any);
  }, []);

  return (
    <div className="shell">
      <aside className="shell__left">
        <h2>Equipment</h2>
        <EquipmentList
          items={equipment}
          selectedId={selectedEquipment?._id}
          onSelect={(eq) => setSelectedEquipment(eq)}
        />
      </aside>

      <main className="shell__main">
        <div className="main__row">
          

          <h2>
            {view === "calendar"
              ? `${selectedEquipment ? selectedEquipment.name : ""} - Calendar`
              : "Availability"}
          </h2>



          <div className="main__toolbar">
            <div className="seg" role="tablist" aria-label="Switch view">
              <button
                role="tab"
                aria-selected={view === "calendar"}
                className={`seg__btn ${view === "calendar" ? "is-active" : ""}`}
                onClick={() => setView("calendar")}
              >
                Calendar
              </button>
              <button
                role="tab"
                aria-selected={view === "matrix"}
                className={`seg__btn ${view === "matrix" ? "is-active" : ""}`}
                onClick={() => setView("matrix")}
              >
                Matrix
              </button>
            </div>
            <a href="/report" target="_blank" rel="noopener" className="btn">Usage Report</a>
          </div>
        </div>

        {/* NEW: two-column content area — calendar + legend (legend only for Calendar view) */}
        <div className={`main__content ${view === "matrix" ? "is-matrix" : ""}`}>
          {view === "calendar" && selectedEquipment && (
            <div className="main__calendar">
              <Calendar
                month={month}
                onMonthChange={setMonth}
                equipmentId={selectedEquipment._id}
                onPickRange={(start, end) => setCreateModal({ start, end })}
              />
            </div>
          )}

          {view === "calendar" && (
            <aside className="main__legend">
              <Legend people={people} stacked />
            </aside>
          )}

          {view === "matrix" && (
            <div className="main__calendar">
              <AvailabilityMatrix month={month} equipment={equipment} />
            </div>
          )}
        </div>
      </main>

      {createModal && selectedEquipment && (
        <BookingModal
          mode="create"
          people={people}
          equipment={selectedEquipment}
          startDate={createModal.start}
          endDate={createModal.end}
          onClose={() => setCreateModal(null)}
          onSaved={() => setCreateModal(null)}
        />
      )}

      {editBooking && (
        <BookingModal
          mode="edit"
          booking={editBooking}
          people={people}
          equipment={editBooking.equipment || null}
          startDate={editBooking.startDate}
          endDate={editBooking.endDate}
          onClose={() => setEditBooking(null)}
          onSaved={() => setEditBooking(null)}
        />
      )}

      <ContextMenu />
    </div>
  );
}
