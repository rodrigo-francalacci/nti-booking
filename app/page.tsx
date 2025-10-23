"use client";

import { useEffect, useMemo, useState } from "react";
import EquipmentList from "./components/EquipmentList";
import Calendar from "./components/Calendar";
import BookingModal from "./components/BookingModal";
import Legend from "./components/Legend";
import AvailabilityMatrix from "./components/AvailabilityMatrix";
import ContextMenu from "./components/ContextMenu";
import "@/app/globals.scss";

type Person = {
  _id: string;
  fullName: string;
  initials: string;
  color: string;
  location?: string;
};

type Equipment = {
  _id: string;
  name: string;
  assetNumber?: string;
  serialNumber?: string;
  calibrationDueAt?: string;
};

type ViewMode = "calendar" | "matrix";

export default function AppPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [month, setMonth] = useState(new Date()); // controls calendar + matrix
  const [createModal, setCreateModal] = useState<{ start: string; end: string } | null>(null);

  // NEW: remember last view
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "calendar";
    return (localStorage.getItem("nti.view") as ViewMode) || "calendar";
  });
  useEffect(() => {
    localStorage.setItem("nti.view", view);
  }, [view]);

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

  // listen for "edit-booking" from ContextMenu to open edit modal
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
         {/*  <h2>{view === "calendar" ? "Calendar" : "Availability"}</h2> */}
          <a href="/report" target="_blank" rel="noopener" className="btn">Usage Report</a>
          <div className="main__toolbar">
           
            <div className="seg" role="tablist" aria-label="Switch view">
              <button
                role="tab"
                aria-selected={view === "calendar"}
                className={`seg__btn ${view === "calendar" ? "is-active" : ""}`}
                onClick={() => setView("calendar")}
              >
                {selectedEquipment?.name} - Calendar
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
          </div>
        </div>

        {view === "calendar" && selectedEquipment && (
          <Calendar
            month={month}
            onMonthChange={setMonth}
            equipmentId={selectedEquipment._id}
            onPickRange={(start, end) => setCreateModal({ start, end })}
          />
        )}

         {view === "calendar" && <Legend people={people} />}

        {view === "matrix" && (
          <AvailabilityMatrix month={month} equipment={equipment} />
        )}
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
