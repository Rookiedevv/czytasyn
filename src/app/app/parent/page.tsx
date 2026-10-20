import Link from "next/link";
import { redirect } from "next/navigation";
import { createChild, deleteChild, getUser, listChildren, signOut } from "@/actions/children";
import { loadStates, recentSessions } from "@/actions/engine";
import { AVATARS } from "@/content/lessons";
import { WORLDS } from "@/engine/content";
import { PL_GPC_ORDER, NODE_BY_ID } from "@/engine/graph";
import { PHASE_LABEL_PL, masteredGraphemes, phaseOf, practisingGraphemes, stageOf, type StateMap } from "@/engine/model";
import { englishUnlocked } from "@/engine/composer";
import ParentGate from "@/components/ParentGate";

type SessionRow = { number: number; probe: boolean; trials: number; correct: number; results: { ok: boolean; ms: number }[]; finished_at: string };

function LetterMap({ states }: { states: StateMap }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PL_GPC_ORDER.map((id) => {
        const st = states[id];
        const status = st?.status ?? "locked";
        const cls =
          status === "mastered"
            ? "bg-emerald-500 text-white"
            : status === "practising" || status === "introduced"
              ? "border-[3px] border-amber-500 text-slate-800"
              : "bg-slate-200 text-slate-400";
        return (
          <span key={id} title={st ? `${st.ok}/${st.seen} dobrze` : "jeszcze nie"} className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-bold ${cls}`}>
            {NODE_BY_ID[id].grapheme}
          </span>
        );
      })}
    </div>
  );
}

export default async function ParentPage() {
  const user = await getUser();
  if (!user) redirect("/");
  const kids = await listChildren();
  const details = await Promise.all(
    kids.map(async (k) => ({ child: k, states: await loadStates(k.id), sessions: (await recentSessions(k.id, 5)) as SessionRow[] })),
  );

  return (
    <ParentGate>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 p-8 text-slate-800">
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold">Strefa rodzica</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{user.email}</span>
            <form action={signOut}>
              <button className="rounded-full border px-4 py-2">Wyloguj</button>
            </form>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Dzieci</h2>
          {kids.length === 0 && <p className="text-slate-500">Dodaj pierwsze dziecko poniżej.</p>}
          {details.map(({ child: k, states, sessions }) => {
            const real = sessions.filter((s) => !s.probe);
            const trials = real.reduce((n, s) => n + s.trials, 0);
            const correct = real.reduce((n, s) => n + s.correct, 0);
            const acc = trials ? Math.round((100 * correct) / trials) : null;
            const lat = real.flatMap((s) => s.results.filter((r) => r.ok).map((r) => r.ms)).sort((a, b) => a - b);
            const med = lat.length ? (lat[Math.floor(lat.length / 2)] / 1000).toFixed(1) : "—";
            const started = Object.keys(states).length > 0;
            return (
              <div key={k.id} className="space-y-4 rounded-2xl bg-white p-5 shadow">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{k.avatar}</span>
                  <div className="flex-1">
                    <p className="text-xl font-bold">{k.name}</p>
                    <p className="text-sm text-slate-500">
                      {started ? `etap ${stageOf(states)} · faza ${PHASE_LABEL_PL[phaseOf(states)]}` : "jeszcze nie zaczął"} · świat: {WORLDS[k.world]?.name ?? "—"}
                    </p>
                  </div>
                  <Link href={`/app/play/${k.id}`} className="rounded-full bg-amber-500 px-4 py-2 text-white">
                    Graj
                  </Link>
                  <form action={deleteChild}>
                    <input type="hidden" name="childId" value={k.id} />
                    <button className="rounded-full border px-4 py-2 text-rose-600">Usuń</button>
                  </form>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Sesje" value={String(k.session_count ?? 0)} />
                  <Stat label="Opanowane" value={`${masteredGraphemes(states).length} liter`} />
                  <Stat label="Trafność (5 sesji)" value={acc === null ? "—" : `${acc}%`} sub={`mediana ${med} s`} />
                  <Stat label="Ćwiczone teraz" value={practisingGraphemes(states).join(" ") || "—"} />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">Litery</p>
                    <p className="text-xs text-slate-500">
                      <span className="mr-3"><i className="mr-1 inline-block h-3 w-3 rounded bg-emerald-500 align-middle" />opanowane</span>
                      <span className="mr-3"><i className="mr-1 inline-block h-3 w-3 rounded border-2 border-amber-500 align-middle" />ćwiczone</span>
                      <span><i className="mr-1 inline-block h-3 w-3 rounded bg-slate-200 align-middle" />jeszcze nie</span>
                    </p>
                  </div>
                  <LetterMap states={states} />
                  <p className="text-xs text-slate-500">
                    🇬🇧 Angielski: {englishUnlocked(states) ? "odblokowany" : "odblokuje się, gdy dziecko czyta wyrazy typu kot, dom (pl:CVC)"}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Dodaj dziecko</h2>
          <form action={createChild} className="space-y-5">
            <label className="block">
              <span className="text-sm text-slate-500">Imię</span>
              <input name="name" required maxLength={30} className="mt-1 w-full rounded-xl border p-3 text-lg" />
            </label>
            <fieldset>
              <legend className="text-sm text-slate-500">Postać</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATARS.map((a, i) => (
                  <label key={a} className="cursor-pointer">
                    <input type="radio" name="avatar" value={a} defaultChecked={i === 0} className="peer sr-only" />
                    <span className="block rounded-2xl border-2 border-transparent p-2 text-4xl peer-checked:border-amber-500 peer-checked:bg-amber-50">{a}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <input type="hidden" name="lang" value="pl" />
            <input type="hidden" name="theme" value="forest" />
            <p className="text-sm text-slate-500">Nauka zaczyna się po polsku; angielski odblokuje się automatycznie, gdy polskie czytanie będzie stabilne.</p>
            <button className="rounded-full bg-amber-500 px-8 py-3 text-xl font-bold text-white">Dodaj</button>
          </form>
        </section>

        <Link href="/app" className="text-slate-500 underline">
          ← Wróć do wyboru dziecka
        </Link>
      </main>
    </ParentGate>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
