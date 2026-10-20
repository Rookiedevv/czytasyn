"use client";

import { useEffect } from "react";
import { saveProgress } from "@/actions/children";

/** Flushes lesson results that were stored locally while offline. */
export default function PendingSync() {
  useEffect(() => {
    const key = "czytasyn.pending";
    let pending: Parameters<typeof saveProgress>[0][] = [];
    try {
      pending = JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return;
    }
    if (pending.length === 0) return;
    (async () => {
      const left: typeof pending = [];
      for (const p of pending) {
        try {
          await saveProgress(p);
        } catch {
          left.push(p);
        }
      }
      localStorage.setItem(key, JSON.stringify(left));
    })();
  }, []);
  return null;
}
