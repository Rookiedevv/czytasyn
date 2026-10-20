import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOwnChild, getProgress } from "@/actions/children";
import { lessonsFor, THEMES } from "@/content/lessons";

export default async function LessonMap({ params }: PageProps<"/app/play/[childId]">) {
  const session = await auth();
  if (!session?.user) redirect("/");
  const { childId } = await params;
  const child = await getOwnChild(childId);
  if (!child) notFound();

  const lessons = lessonsFor(child.lang === "en" ? "en" : "pl");
  const prog = await getProgress(child.id);
  const theme = THEMES[child.theme] ?? THEMES.forest;

  // A lesson unlocks once the previous one has been completed.
  let unlockedUpTo = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (prog.find((p) => p.lessonId === lessons[i].id)?.completed) unlockedUpTo = i + 1;
    else break;
  }

  return (
    <main className={`relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b ${theme.bg} p-8 text-center select-none`}>
      <Link href="/app" className="absolute left-6 top-6 rounded-full bg-white/70 px-5 py-3 text-2xl shadow">
        ←
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-7xl">{child.avatar}</span>
        <h1 className="text-5xl font-extrabold text-slate-800">{child.name}</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {lessons.map((l, i) => {
          const p = prog.find((x) => x.lessonId === l.id);
          const locked = i > unlockedUpTo;
          const stars = p?.stars ?? 0;
          const inner = (
            <>
              <span className="text-6xl font-extrabold">{locked ? "🔒" : i + 1}</span>
              <span className="text-lg font-semibold">{l.title}</span>
              <span className="text-2xl">{locked ? "" : "⭐".repeat(stars) + "☆".repeat(3 - stars)}</span>
            </>
          );
          return locked ? (
            <div key={l.id} className="flex w-48 flex-col items-center gap-2 rounded-[2rem] bg-white/40 p-6 text-slate-400">
              {inner}
            </div>
          ) : (
            <Link
              key={l.id}
              href={`/app/play/${child.id}/${l.id}`}
              className="flex w-48 flex-col items-center gap-2 rounded-[2rem] bg-white p-6 text-slate-800 shadow-xl transition active:scale-95"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
