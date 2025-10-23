"use client";

import { useEffect, useState } from "react";
import { useBusy } from "../components/BusyProvider";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export default function ContextMenu() {
  const [item, setItem] = useState<any | null>(null);
  const { withBusy } = useBusy();

  useEffect(() => {
    const h = (e: Event) => setItem((e as CustomEvent).detail);
    window.addEventListener("open-booking-context", h as any);
    return () => window.removeEventListener("open-booking-context", h as any);
  }, []);

  if (!item) return null;

  async function remove() {
    if (!item?._id) return;

    await withBusy(async () => {
      await nextFrame(); // let the overlay render first
      const r = await fetch(`/api/bookings/${item._id}`, { method: "DELETE" });
      if (!r.ok) return alert("Could not delete booking.");
      setItem(null);
      await sleep(300); // linger a bit for smoother update
      location.reload();
    }, "Deleting booking…");
  }

  function edit() {
    const ev = new CustomEvent("edit-booking", { detail: item });
    window.dispatchEvent(ev);
    setItem(null);
  }

  return (
    <div className="ctx" onClick={() => setItem(null)}>
      <div className="ctx__card" onClick={(e) => e.stopPropagation()}>
        <b style={{ display: "block", marginBottom: 8 }}>{item.person?.fullName}</b>
        <button onClick={edit}>Edit dates / note</button>
        <button onClick={remove} className="danger">Cancel booking</button>
        <button onClick={() => setItem(null)} className="ghost">Close</button>
      </div>
      <style jsx>{`
        .ctx { position: fixed; inset: 0; background: rgba(0,0,0,.25); display: grid; place-items: center; z-index: 50; }
        .ctx__card { background: #fff; padding: 14px; border-radius: 12px; width: min(360px, 92vw); box-shadow: 0 8px 26px rgba(0,0,0,.18); }
        button { margin-right: 8px; margin-top: 6px; padding: 8px 12px; border-radius: 10px; border: none; background: #0a84ff; color: #fff; cursor: pointer; }
        .danger { background: #ffecec; color: #c0392b; border: 1px solid #ffd0d0; }
        .ghost { background: #eef2f8; color: #223; }
      `}</style>
    </div>
  );
}
