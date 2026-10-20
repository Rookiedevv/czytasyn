"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const KEY = "czytasyn.parentGate";
const TTL_MS = 10 * 60 * 1000; // stay unlocked for 10 minutes

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach((cb) => cb());
}
function isUnlocked(): boolean {
  try {
    const until = Number(sessionStorage.getItem(KEY) ?? 0);
    return until > Date.now();
  } catch {
    return false;
  }
}
function unlock() {
  try {
    sessionStorage.setItem(KEY, String(Date.now() + TTL_MS));
  } catch {
    /* ignore */
  }
  notify();
}

function makeQuestion() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 2 + Math.floor(Math.random() * 7);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

/**
 * Keeps small children out of the parent area: hold a button for 2 seconds,
 * then answer a small sum. Not security, just a speed bump.
 */
export default function ParentGate({ children }: { children: ReactNode }) {
  // null while server-rendering, so the gate never flashes the wrong state.
  const open = useSyncExternalStore<boolean | null>(subscribe, isUnlocked, () => null);
  const [held, setHeld] = useState(false);
  const [q, setQ] = useState(makeQuestion);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const timer = useRef<number | null>(null);

  function startHold() {
    timer.current = window.setTimeout(() => setHeld(true), 2000);
  }
  function cancelHold() {
    if (timer.current) window.clearTimeout(timer.current);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(value) === q.answer) {
      unlock();
    } else {
      setWrong(true);
      setValue("");
      setQ(makeQuestion());
    }
  }

  if (open === null) return null;
  if (open) return <>{children}</>;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-slate-100 p-8 text-slate-800">
      <h1 className="text-3xl font-bold">Strefa rodzica</h1>
      {!held ? (
        <>
          <p className="text-lg text-slate-600">Przytrzymaj przycisk przez 2 sekundy.</p>
          <button
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            className="select-none rounded-full bg-slate-800 px-12 py-6 text-2xl font-semibold text-white active:scale-95"
          >
            Przytrzymaj
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-center gap-4">
          <p className="text-2xl">{q.text}</p>
          <input
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32 rounded-xl border-2 border-slate-300 p-3 text-center text-2xl"
          />
          {wrong && <p className="text-rose-600">Nie, spróbuj jeszcze raz.</p>}
          <button className="rounded-full bg-slate-800 px-8 py-3 text-xl text-white">OK</button>
        </form>
      )}
      <a href="/app" className="text-slate-500 underline">
        Wróć do dzieci
      </a>
    </main>
  );
}
