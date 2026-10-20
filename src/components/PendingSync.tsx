"use client";

import { useEffect } from "react";
import { finishSession, type FinishInput } from "@/actions/engine";

/** Flushes sessions that finished while offline. */
export default function PendingSync() {
  useEffect(() => {
    const key = "czytasyn.pendingSessions";
    let pending: FinishInput[] = [];
    try {
      pending = JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return;
    }
    if (pending.length === 0) return;
    (async () => {
      const left: FinishInput[] = [];
      for (const p of pending) {
        try {
          await finishSession(p);
        } catch {
          left.push(p);
        }
      }
      localStorage.setItem(key, JSON.stringify(left));
    })();
  }, []);
  return null;
}
