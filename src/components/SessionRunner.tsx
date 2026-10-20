"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Session, Trial } from "@/engine/composer";
import type { World, Word } from "@/engine/content";
import { SAY_PL } from "@/engine/graph";
import { masteredGraphemes, practisingGraphemes } from "@/engine/model";
import type { TrialResult } from "@/engine/evaluate";
import { finishSession } from "@/actions/engine";
import { playTone, speak, unlockAudio } from "@/lib/audio";
import { Markup } from "./CollectionGrid";

type Props = {
  child: { id: string; name: string; avatar: string };
  world: World;
  session: Session;
  collected: number;
};

const say = (g: string) => SAY_PL[g] ?? g;

/** What the voice says when a trial appears. */
function promptFor(t: Trial): string {
  switch (t.type) {
    case "sound":
      return `${say(t.grapheme)}. Jaką głoskę słyszysz? Dotknij literę.`;
    case "syllable":
      return `${say(t.c)}, ${say(t.v)}, ${t.target}. Dotknij: ${t.target}.`;
    case "word":
      return `Przeczytaj wyraz i dotknij obrazek.`;
    case "sentence":
      return `${t.text} Dotknij obrazek, który pasuje.`;
    case "pa-clap":
      return `${t.word.text}. Ile sylab? Klaśnij i dotknij liczbę. ${t.word.syllables.join(", ")}.`;
    case "pa-first":
      return `Który obrazek zaczyna się na ${say(t.sound)}?`;
    case "peek":
      return `${t.word.text}. To słowo z Twojego świata.`;
  }
}

export default function SessionRunner({ child, world, session, collected }: Props) {
  const [queue, setQueue] = useState<Trial[]>(session.trials);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "run" | "saving" | "done">("intro");
  const [feedback, setFeedback] = useState<{ ok: boolean; key: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [firstTryOk, setFirstTryOk] = useState(0);
  const [errors, setErrors] = useState(0);
  const [newItem, setNewItem] = useState<number>(collected);
  const [saveState, setSaveState] = useState<"ok" | "queued" | "">("");

  const queueRef = useRef<Trial[]>(session.trials);
  const results = useRef<TrialResult[]>([]);
  const t0 = useRef(0);
  const triedThis = useRef(false);
  const consecutiveErrors = useRef(0);
  const startedAt = useRef(new Date().toISOString());

  const trial = queue[index];
  const total = queue.length;
  const known = [...masteredGraphemes(session.states), ...practisingGraphemes(session.states)];

  function updateQueue(fn: (q: Trial[]) => Trial[]) {
    queueRef.current = fn(queueRef.current);
    setQueue(queueRef.current);
  }

  async function present(t: Trial) {
    t0.current = performance.now();
    triedThis.current = false;
    setLocked(true);
    await speak(promptFor(t), "pl", t.type === "sound" || t.type === "syllable" ? 0.75 : 0.85);
    t0.current = performance.now();
    setLocked(false);
  }

  async function start() {
    await unlockAudio();
    setPhase("run");
    await present(queueRef.current[0]);
  }

  async function replay() {
    await unlockAudio();
    if (trial) await speak(promptFor(trial), "pl", 0.75);
  }

  function record(t: Trial, ok: boolean) {
    if (!t.node) return;
    const ms = Math.round(performance.now() - t0.current);
    results.current.push({ node: t.node, type: t.type, ok, ms, t: new Date().toISOString() });
  }

  async function finish() {
    setPhase("saving");
    const payload = {
      childId: child.id,
      sessionNumber: session.number,
      worldId: world.id,
      probe: session.probe,
      states: session.states,
      results: results.current,
      startedAt: startedAt.current,
    };
    try {
      const r = await finishSession(payload);
      setNewItem(r.collection);
      setSaveState("ok");
    } catch {
      try {
        const key = "czytasyn.pendingSessions";
        const pending = JSON.parse(localStorage.getItem(key) ?? "[]");
        pending.push(payload);
        localStorage.setItem(key, JSON.stringify(pending));
      } catch {
        /* ignore */
      }
      setNewItem(Math.min(collected + 1, world.collection.length));
      setSaveState("queued");
    }
    setPhase("done");
    playTone("win");
  }

  async function advance() {
    setFeedback(null);
    const next = index + 1;
    if (next >= queueRef.current.length) {
      await finish();
      return;
    }
    setIndex(next);
    await present(queueRef.current[next]);
  }

  async function answer(correct: boolean, key: string) {
    if (locked || !trial) return;
    await unlockAudio();
    if (correct) {
      setLocked(true);
      playTone("correct");
      setFeedback({ ok: true, key });
      if (!triedThis.current) setFirstTryOk((n) => n + 1);
      consecutiveErrors.current = 0;
      record(trial, !triedThis.current);
      await speak(trial.type === "word" || trial.type === "sentence" ? trial.word.text : "Super!", "pl", 1);
      await advance();
    } else {
      playTone("wrong");
      setFeedback({ ok: false, key });
      setErrors((n) => n + 1);
      consecutiveErrors.current += 1;
      if (!triedThis.current) {
        triedThis.current = true;
        // Re-present the same item two trials later with fewer choices (scaffold step down).
        const easier = scaffoldDown(trial);
        updateQueue((q) => {
          const copy = [...q];
          copy.splice(Math.min(index + 2, copy.length), 0, easier);
          return copy;
        });
      }
      // Three errors in a row: no more new material, keep what is left easy.
      if (consecutiveErrors.current >= 3) {
        updateQueue((q) => q.filter((t, i) => i <= index || !session.introduced.includes(t.node ?? "")));
      }
      await speak("Spróbuj jeszcze raz.", "pl", 1);
      setTimeout(() => setFeedback(null), 400);
    }
  }

  // ---------------------------------------------------------------- screens

  if (phase === "intro") {
    return (
      <Screen>
        <span className="text-8xl">{world.mascot}</span>
        <h1 className="text-5xl font-extrabold text-slate-800">{child.name}</h1>
        <p className="text-xl text-slate-600">
          {session.probe ? "Najpierw zobaczymy, co już umiesz." : `${world.name} · sesja ${session.number}`}
        </p>
        <button onClick={start} className={`${world.accent} mt-4 rounded-full px-16 py-8 text-4xl font-bold shadow-xl active:scale-95`}>
          ▶ Start
        </button>
        <Link href={`/app/play/${child.id}`} className="mt-8 text-slate-500 underline">
          Wróć
        </Link>
      </Screen>
    );
  }

  if (phase === "saving") {
    return (
      <Screen>
        <span className="text-7xl">⏳</span>
      </Screen>
    );
  }

  if (phase === "done") {
    const item = world.collection[Math.max(0, Math.min(newItem, world.collection.length) - 1)];
    const focus = practisingGraphemes(session.states)[0] ?? masteredGraphemes(session.states).slice(-1)[0] ?? "a";
    return (
      <Screen>
        <h1 className={`rounded-full px-6 py-2 text-4xl font-extrabold ${world.chip}`}>Brawo! Odkrywasz…</h1>
        {item && !session.probe ? (
          <button
            onClick={async () => {
              await unlockAudio();
              speak(`${item.name}. ${item.fact}`, "pl", 0.9);
            }}
            className="flex flex-col items-center gap-2 rounded-[2.5rem] bg-white px-10 py-6 shadow-xl active:scale-95"
          >
            <span className="text-8xl">{item.pic}</span>
            <span className="text-5xl font-extrabold">
              <Markup text={item.name} known={known} />
            </span>
            <span className="text-xl text-slate-600">{item.fact}</span>
            <span className="text-sm text-slate-400">
              kolekcja {newItem}/{world.collection.length} · 🔊 dotknij, żeby posłuchać
            </span>
          </button>
        ) : (
          <p className="text-2xl text-slate-700">Sprawdzenie zrobione. Teraz wiemy, od czego zacząć!</p>
        )}
        <p className="text-slate-600">
          {total} zadań · {firstTryOk} za pierwszym razem · pomyłek: {errors} {saveState === "queued" ? "· 📶 zapisze się później" : ""}
        </p>
        <div className="max-w-xl rounded-3xl bg-white/80 p-5 text-left text-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dla rodzica · 30 sekund bez ekranu</p>
          <p className="text-xl">
            Znajdźcie razem w pokoju trzy rzeczy na <b className="rounded-lg bg-amber-200 px-2">{focus}</b>. Mów głoskę jako „{say(focus)}”, nie nazwę litery.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          <Link href={`/app/play/${child.id}/session/${world.id}`} className={`${world.accent} rounded-full px-8 py-4 text-2xl font-bold shadow-xl active:scale-95`}>
            Jeszcze raz
          </Link>
          {!session.probe && (
            <Link href={`/app/play/${child.id}/collection/${world.id}`} className="rounded-full bg-white px-8 py-4 text-2xl font-bold text-slate-700 shadow-xl active:scale-95">
              Kolekcja
            </Link>
          )}
          <Link href={`/app/play/${child.id}`} className="rounded-full bg-white px-8 py-4 text-2xl font-bold text-slate-700 shadow-xl active:scale-95">
            Inny świat
          </Link>
        </div>
      </Screen>
    );
  }

  if (!trial) return null;

  return (
    <Screen>
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-3">
        <Link href={`/app/play/${child.id}`} className="rounded-full bg-white/70 px-5 py-3 text-2xl shadow">
          ←
        </Link>
        <div className="flex flex-wrap justify-center gap-1">
          {queue.map((_, i) => (
            <span key={i} className={`h-3 w-5 rounded-full ${i < index ? "bg-emerald-500" : i === index ? "bg-slate-800" : "bg-white/60"}`} />
          ))}
        </div>
        <span className={`rounded-full px-3 py-1 text-sm ${world.chip}`}>{world.mascot}</span>
      </div>

      <TrialView trial={trial} feedback={feedback} onAnswer={answer} onReplay={replay} world={world} known={known} />
    </Screen>
  );
}

function scaffoldDown(t: Trial): Trial {
  const fewer = <T,>(choices: T[], target: T) => {
    if (choices.length <= 2) return choices;
    const others = choices.filter((c) => c !== target);
    return [target, others[0]].sort(() => Math.random() - 0.5);
  };
  switch (t.type) {
    case "sound":
      return { ...t, choices: fewer(t.choices, t.grapheme) };
    case "syllable":
      return { ...t, choices: fewer(t.choices, t.target) };
    case "word":
    case "sentence":
      return { ...t, choices: fewer(t.choices, t.word) };
    case "pa-first":
      return { ...t, choices: fewer(t.choices, t.word) };
    default:
      return t;
  }
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 p-8 pt-24 text-center select-none">
      {children}
    </main>
  );
}

function Speaker({ onClick, accent }: { onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick} className={`${accent} flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg active:scale-95`} aria-label="Posłuchaj">
      🔊
    </button>
  );
}

type TrialViewProps = {
  trial: Trial;
  feedback: { ok: boolean; key: string } | null;
  onAnswer: (correct: boolean, key: string) => void;
  onReplay: () => void;
  world: World;
  known: string[];
};

function choiceClass(key: string, feedback: TrialViewProps["feedback"], base: string) {
  const fb = feedback && feedback.key === key ? (feedback.ok ? "bg-emerald-300 scale-110" : "bg-rose-200 animate-pulse") : "bg-white";
  return `${base} ${fb} rounded-[2.5rem] font-bold leading-none text-slate-800 shadow-xl transition active:scale-95`;
}

function PicChoices({ choices, target, feedback, onAnswer }: { choices: Word[]; target: Word; feedback: TrialViewProps["feedback"]; onAnswer: TrialViewProps["onAnswer"] }) {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      {choices.map((w) => (
        <button key={w.text} onClick={() => onAnswer(w.text === target.text, w.text)} className={choiceClass(w.text, feedback, "min-w-[11rem] px-8 py-6 text-[7rem]")} aria-label={w.text}>
          {w.pic}
        </button>
      ))}
    </div>
  );
}

function TrialView({ trial, feedback, onAnswer, onReplay, world, known }: TrialViewProps) {
  switch (trial.type) {
    case "sound":
      return (
        <>
          <div className="flex items-center gap-6">
            <Speaker onClick={onReplay} accent={world.accent} />
            <h2 className="text-3xl font-semibold text-slate-700">Jaką głoskę słyszysz?</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {trial.choices.map((g) => (
              <button key={g} onClick={() => onAnswer(g === trial.grapheme, g)} className={choiceClass(g, feedback, "min-w-[11rem] px-10 py-4 text-[9rem]")}>
                {g}
              </button>
            ))}
          </div>
        </>
      );
    case "syllable":
      return (
        <>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-3 text-6xl font-bold text-slate-800 shadow">
              <span>{trial.c}</span>
              <span className="text-3xl text-slate-400">+</span>
              <span>{trial.v}</span>
              <span className="text-3xl text-slate-400">=</span>
              <span className={`rounded-2xl px-4 ${world.accent}`}>{trial.target}</span>
            </div>
            <Speaker onClick={onReplay} accent={world.accent} />
          </div>
          <h2 className="text-3xl font-semibold text-slate-700">Dotknij, gdzie to jest napisane.</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {trial.choices.map((s) => (
              <button key={s} onClick={() => onAnswer(s === trial.target, s)} className={choiceClass(s, feedback, "min-w-[11rem] px-8 py-4 text-[6.5rem]")}>
                {s}
              </button>
            ))}
          </div>
        </>
      );
    case "word":
      return (
        <>
          <div className="flex items-center gap-6">
            <div className="flex gap-1 rounded-3xl bg-white px-6 py-3 text-7xl font-bold text-slate-800 shadow">
              {trial.word.text.split("").map((l, i) => (
                <button key={i} onClick={() => speak(say(l), "pl", 0.7)} className="rounded-xl px-2 active:bg-amber-100">
                  {l}
                </button>
              ))}
            </div>
            <Speaker onClick={onReplay} accent={world.accent} />
          </div>
          <h2 className="text-3xl font-semibold text-slate-700">Przeczytaj i dotknij obrazek.</h2>
          <PicChoices choices={trial.choices} target={trial.word} feedback={feedback} onAnswer={onAnswer} />
        </>
      );
    case "sentence":
      return (
        <>
          <div className="flex items-center gap-6">
            <div className="rounded-3xl bg-white px-8 py-4 text-6xl font-bold text-slate-800 shadow">{trial.text}</div>
            <Speaker onClick={onReplay} accent={world.accent} />
          </div>
          <h2 className="text-3xl font-semibold text-slate-700">Dotknij obrazek, który pasuje.</h2>
          <PicChoices choices={trial.choices} target={trial.word} feedback={feedback} onAnswer={onAnswer} />
        </>
      );
    case "pa-clap":
      return (
        <>
          <div className="flex items-center gap-6">
            <span className="text-[7rem]">{trial.word.pic}</span>
            <Speaker onClick={onReplay} accent={world.accent} />
          </div>
          <h2 className="text-3xl font-semibold text-slate-700">Ile sylab? Klaśnij i dotknij liczbę.</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => onAnswer(n === trial.word.syllables.length, String(n))} className={choiceClass(String(n), feedback, "min-w-[11rem] px-10 py-4 text-[8rem]")}>
                {"👏".repeat(n)}
              </button>
            ))}
          </div>
        </>
      );
    case "pa-first":
      return (
        <>
          <div className="flex items-center gap-6">
            <Speaker onClick={onReplay} accent={world.accent} />
            <h2 className="text-3xl font-semibold text-slate-700">Który obrazek zaczyna się na „{say(trial.sound)}”?</h2>
          </div>
          <PicChoices choices={trial.choices} target={trial.word} feedback={feedback} onAnswer={onAnswer} />
        </>
      );
    case "peek":
      return (
        <>
          <span className="text-[8rem]">{trial.word.pic}</span>
          <div className="rounded-3xl bg-white px-8 py-4 text-7xl font-bold text-slate-800 shadow">
            <Markup text={trial.word.text} known={known} />
          </div>
          <p className="text-lg text-slate-600">Słowo z Twojego świata. Zielone litery już znasz.</p>
          <div className="flex gap-6">
            <Speaker onClick={onReplay} accent={world.accent} />
            <button onClick={() => onAnswer(true, "next")} className={`${world.accent} rounded-full px-12 py-6 text-3xl font-bold shadow-xl active:scale-95`}>
              Dalej
            </button>
          </div>
        </>
      );
  }
}
