import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOwnChild, getUser } from "@/actions/children";
import { loadStates } from "@/actions/engine";
import { WORLDS, decodableWords } from "@/engine/content";
import { masteredGraphemes, practisingGraphemes } from "@/engine/model";

export default async function WorldPicker({ params }: PageProps<"/app/play/[childId]">) {
  const user = await getUser();
  if (!user) redirect("/");
  const { childId } = await params;
  const child = await getOwnChild(childId);
  if (!child) notFound();

  const states = await loadStates(child.id);
  const mastered = masteredGraphemes(states);
  const practising = practisingGraphemes(states);
  const firstTime = Object.keys(states).length === 0;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b from-amber-200 to-orange-100 p-8 text-center select-none">
      <Link href="/app" className="absolute left-6 top-6 rounded-full bg-white/70 px-5 py-3 text-2xl shadow">
        ←
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-7xl">{child.avatar}</span>
        <h1 className="text-5xl font-extrabold text-slate-800">
          {firstTime ? "Zaczynamy!" : "Wybierz świat"}
        </h1>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {Object.values(WORLDS).map((w) => {
          const readable = w.words.filter((x) => decodableWords(w.id, mastered, practising).words.some((y) => y.text === x.text)).length;
          const got = child.collection?.[w.id] ?? 0;
          return (
            <Link
              key={w.id}
              href={`/app/play/${child.id}/session/${w.id}`}
              className={`flex w-64 flex-col items-center gap-3 rounded-[2.5rem] bg-gradient-to-b ${w.bg} p-8 shadow-xl transition active:scale-95`}
            >
              <span className="text-8xl">{w.mascot}</span>
              <span className={`rounded-full px-4 py-1 text-2xl font-bold ${w.chip}`}>{w.name}</span>
              {!firstTime && (
                <span className={`text-sm opacity-80 ${w.chip} rounded-full px-3 py-1`}>
                  📖 {readable} · 🏆 {got}/{w.collection.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <p className="text-lg text-amber-900/60">
        {firstTime ? "Dotknij świata — najpierw krótkie sprawdzenie, co już umiesz." : "Dotknij świata, w którym chcesz dziś czytać."}
      </p>
    </main>
  );
}
