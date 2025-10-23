"use client";

import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import "../styles/busy.scss";

const MIN_DURATION_MS = 600; // ✅ overlay lingers at least this long

type BusyCtx = {
  busy: boolean;
  message?: string;
  start: (msg?: string) => void;
  stop: () => void;
  withBusy: <T>(fn: () => Promise<T>, msg?: string) => Promise<T>;
};

const Ctx = createContext<BusyCtx | null>(null);

export function BusyProvider({ children }: { children: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const counter = useRef(0);
  const firstStartTime = useRef<number | null>(null);

  const api = useMemo<BusyCtx>(() => ({
    busy,
    message,
    start: (msg) => {
      counter.current += 1;
      if (counter.current === 1) {
        firstStartTime.current = performance.now();
        setMessage(msg || "Processing…");
        setBusy(true);
      } else if (msg) {
        setMessage(msg); // allow message change while stacking
      }
    },
    stop: () => {
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current > 0) return;

      const started = firstStartTime.current ?? performance.now();
      const elapsed = performance.now() - started;
      const remain = Math.max(0, MIN_DURATION_MS - elapsed);

      const clear = () => {
        firstStartTime.current = null;
        setBusy(false);
        setMessage(undefined);
      };

      if (remain > 0) {
        setTimeout(clear, remain);
      } else {
        clear();
      }
    },
    withBusy: async <T,>(fn: () => Promise<T>, msg?: string) => {
      api.start(msg);
      try {
        return await fn();
      } finally {
        api.stop();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [busy, message]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {busy && (
        <div className="busy" aria-live="polite" aria-busy="true" role="status">
          <div className="busy__card">
            <div className="busy__spinner" />
            <div className="busy__text">{message || "Processing…"}</div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useBusy() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBusy must be used inside <BusyProvider>");
  return ctx;
}
