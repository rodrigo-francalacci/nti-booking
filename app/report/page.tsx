"use client";

import { useEffect, useMemo, useState } from "react";
import "@/app/globals.scss";

type Row = {
  _id: string;
  startDate: string;
  endDate: string;
  note?: string;
  personName?: string;
  equipmentId: string;
  equipmentName?: string;
  assetNumber?: string;
};

export default function ReportPage() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const first = `${y}-${m}-01`;
  const last = new Date(y, today.getMonth() + 1, 0).getDate();
  const lastStr = `${y}-${m}-${String(last).padStart(2, "0")}`;

  const [start, setStart] = useState(first);
  const [end, setEnd] = useState(lastStr);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!start || !end) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ start, end });
      const data = await fetch(`/api/report?${qs}`, { cache: "no-store" }).then(r => r.json());
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, { equipmentName: string; assetNumber: string; rows: Row[] }>();
    for (const r of rows) {
      const key = r.equipmentId;
      const g = map.get(key) || { equipmentName: r.equipmentName || "(Unnamed)", assetNumber: r.assetNumber || "", rows: [] };
      g.rows.push(r);
      g.equipmentName = r.equipmentName || g.equipmentName;
      g.assetNumber   = r.assetNumber   || g.assetNumber;
      map.set(key, g);
    }
    // Sort equipment by assetNumber then name
    return Array.from(map.entries()).sort((a, b) => {
      const A = (a[1].assetNumber || "").localeCompare(b[1].assetNumber || "");
      if (A !== 0) return A;
      return (a[1].equipmentName || "").localeCompare(b[1].equipmentName || "");
    });
  }, [rows]);

  const csvHref = `/api/report/csv?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  return (
    <div style={page}>
      <h2>Usage Report</h2>

      <div style={controls}>
        <div>
          <label>Start</label><br />
          <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        </div>
        <div>
          <label>End</label><br />
          <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
        </div>
        <button onClick={run} disabled={!start || !end || loading}>
          {loading ? "Loading…" : "Show"}
        </button>
        <a className="btn" href={csvHref}>Download CSV</a>
      </div>

      {groups.length === 0 && !loading && <div>No bookings in this range.</div>}

      {groups.map(([eqId, g]) => (
        <section key={eqId} style={{ margin: "18px auto", background:"#fff", borderRadius:10 }}>
          <div style={sectionHead}>
            <h3 style={h3}>
              {g.equipmentName}
              {g.assetNumber ? <span style={muted}> · Asset #{g.assetNumber}</span> : null}
              <span style={muted}> · {g.rows.length}</span>
            </h3>
          </div>
          <div style={{ overflowX: "auto", padding: "0 12px 12px" }}>
            <table style={table}>
              <colgroup><col style={{width:"22%"}}/><col style={{width:"14%"}}/><col style={{width:"14%"}}/><col style={{width:"50%"}}/></colgroup>
              <thead>
                <tr>
                  <th style={th}>Person</th>
                  <th style={th}>Start Date</th>
                  <th style={th}>End Date</th>
                  <th style={th}>Note (Purpose)</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, idx) => (
                  <tr key={r._id} style={idx % 2 ? trAlt : undefined}>
                    <td style={td}>{r.personName || ""}</td>
                    <td style={tdMono}>{r.startDate}</td>
                    <td style={tdMono}>{r.endDate}</td>
                    <td style={td}>{r.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- styles (inline for this page) ---------- */
const page: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 16,
};

const controls: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "end",
  flexWrap: "wrap",
  margin: "12px 0 16px",
};

const sectionHead: React.CSSProperties = {
  padding: "10px 12px 6px",
};

const h3: React.CSSProperties = { margin: 0 };
const muted: React.CSSProperties = { color: "#6b778a", fontWeight: 400 };

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",         // ✅ enforce colgroup widths
  background: "#fff",
  border: "1px solid #e8eef5",
  borderRadius: 10,
  overflow: "hidden",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #e8eef5",
  background: "#f6f9fc",
  fontWeight: 700,
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f0f4fa",
  fontSize: 13,
  verticalAlign: "top",
  wordBreak: "break-word",
};

const tdMono: React.CSSProperties = { ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" };

const trAlt: React.CSSProperties = { background: "#fafcff" };
