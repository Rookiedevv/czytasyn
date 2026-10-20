"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { UI, type Lesson, type LessonItem } from "@/content/lessons";
import { playTone, speak, unlockAudio } from "@/lib/audio";
import { saveProgress } from "@/actions/children";

const ROUNDS = 8;
const CHOICES = 3;

type Round = { target: LessonItem; options: LessonItem[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(lesson: Lesson): Round[] {
  const pool = lesson.items;
  const rounds: Round[] = [];
  let order: LessonItem[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    if (order.length === 0) order = shuffle(pool);
    const target = order.pop()!;
    const others = shuffle(pool.filter((x) => x.text !== target.text)).slice(0, CHOICES - 1);
    rounds.push({ target, options: shuffle([target, ...others]) });
  }
  return rounds;
}

type Props = {
  lesson: Lesson;
  childId: string;
  childName: string;
  accentClass: string;
};

export default function LessonRunner({ lesson, childId, childName, accentClass }: Props) {
  const t = UI[lesson.lang];
  const [rounds] = useState(() => buildRounds(lesson));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "listen" | "choose" | "feedback" | "done">("intro");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "queued">("idle");
  const [finalStars, setFinalStars] = useState(0);
  // Mutable tallies: updated inside async handlers, read when the lesson ends.
  const mistakes = useRef(0);
  const mastered = useRef<Set<string>>(new Set());
  const firstTry = useRef(true);

  const round = rounds[index];
  const starsFor = (m: number) => (m <= 1 ? 3 : m <= 3 ? 2 : 1);

  async function finish() {
    const stars = starsFor(mistakes.current);
    setFinalStars(stars);
    const payload = { childId, lessonId: lesson.id, stars, masteredItems: [...mastered.current] };
    setSaveState("saving");
    try {
      await saveProgress(payload);
      setSaveState("saved");
    } catch {
      // Offline or expired session: keep a local copy, PendingSync flushes it later.
      try {
        const key = "czytasyn.pending";
        const pending = JSON.parse(localStorage.getItem(key) ?? "[]");
        pending.push(payload);
        localStorage.setItem(key, JSON.stringify(pending));
      } catch {
        /* ignore */
      }
      setSaveState("queued");
    }
  }

  const prompt = useCallback(
    async (r: Round) => {
      setPhase("listen");
      await speak(`${t.thisIs} ${r.target.text}. ${r.target.text}, ${t.like} ${r.target.word}.`, lesson.lang);
      setPhase("choose");
    },
    [lesson.lang, t],
  );

  async function start() {
    await unlockAudio();
    firstTry.current = true;
    await prompt(round);
  }

  async function replay() {
    await unlockAudio();
    await speak(`${round.target.text}. ${round.target.word}.`, lesson.lang);
  }

  async function choose(item: LessonItem) {
    if (phase !== "choose") return;
    await unlockAudio();
    if (item.text === round.target.text) {
      playTone("correct");
      setFeedback("ok");
      setPhase("feedback");
      if (firstTry.current) mastered.current.add(item.text);
      await speak(t.great, lesson.lang, 1);
      const next = index + 1;
      if (next >= rounds.length) {
        setPhase("done");
        playTone("win");
        void finish();
      } else {
        setIndex(next);
        setFeedback(null);
        firstTry.current = true;
        await prompt(rounds[next]);
      }
    } else {
      playTone("wrong");
      setFeedback("no");
      mistakes.current += 1;
      firstTry.current = false;
      await speak(t.tryAgain, lesson.lang, 1);
      setFeedback(null);
    }
  }

  const bigText = lesson.kind === "letters" ? "text-[9rem]" : "text-[6rem]";

  if (phase === "intro") {
    return (
      <Screen>
        <p className="text-2xl text-slate-600">{childName}</p>
        <h1 className="text-5xl font-bold">{lesson.title}</h1>
        <button onClick={start} className={`${accentClass} mt-6 rounded-full px-16 py-8 text-4xl font-bold text-white shadow-xl active:scale-95`}>
          ▶ {t.listen}
        </button>
        <Link href={`/app/play/${childId}`} className="mt-10 text-slate-500 underline">
          {t.back}
        </Link>
      </Screen>
    );
  }

  if (phase === "done") {
    const stars = finalStars;
    return (
      <Screen>
        <h1 className="text-6xl font-bold">{t.done}</h1>
        <p className="text-7xl">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</p>
        <p className="text-slate-500">
          {saveState === "saving" ? "…" : saveState === "saved" ? "✓" : saveState === "queued" ? "📶" : ""}
        </p>
        <div className="mt-6 flex gap-6">
          <button
            onClick={() => window.location.reload()}
            className={`${accentClass} rounded-full px-10 py-5 text-3xl font-bold text-white shadow-xl active:scale-95`}
          >
            {t.again}
          </button>
          <Link
            href={`/app/play/${childId}`}
            className="rounded-full bg-white px-10 py-5 text-3xl font-bold text-slate-700 shadow-xl active:scale-95"
          >
            {t.back}
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="absolute left-6 top-6 flex items-center gap-3">
        <Link href={`/app/play/${childId}`} className="rounded-full bg-white/70 px-5 py-3 text-2xl shadow">
          ←
        </Link>
        <div className="flex gap-1">
          {rounds.map((_, i) => (
            <span key={i} className={`h-3 w-6 rounded-full ${i < index ? "bg-emerald-500" : i === index ? "bg-slate-800" : "bg-white/60"}`} />
          ))}
        </div>
      </div>

      <button onClick={replay} className="flex items-center gap-4 rounded-3xl bg-white/80 px-8 py-4 shadow-lg active:scale-95">
        <span className="text-7xl">{round.target.emoji}</span>
        <span className="text-4xl">🔊</span>
      </button>

      <p className="text-3xl font-semibold text-slate-700">{t.whichOne}</p>

      <div className="flex flex-wrap justify-center gap-8">
        {round.options.map((opt) => {
          const isTarget = opt.text === round.target.text;
          const state =
            feedback === "ok" && isTarget ? "bg-emerald-400 scale-110" : feedback === "no" && !isTarget ? "" : "bg-white";
          return (
            <button
              key={opt.text}
              onClick={() => choose(opt)}
              className={`${state} ${bigText} min-w-[12rem] rounded-[2.5rem] px-10 py-4 font-bold leading-none text-slate-800 shadow-xl transition active:scale-95`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center select-none">
      {children}
    </main>
  );
}
