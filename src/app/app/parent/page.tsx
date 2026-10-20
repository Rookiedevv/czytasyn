import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { createChild, deleteChild, listChildren } from "@/actions/children";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { AVATARS, LESSONS, THEMES } from "@/content/lessons";
import ParentGate from "@/components/ParentGate";

export default async function ParentPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const kids = await listChildren();
  const rows =
    kids.length > 0
      ? await db
          .select()
          .from(progress)
          .where(inArray(progress.childId, kids.map((k) => k.id)))
      : [];

  return (
    <ParentGate>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 p-8 text-slate-800">
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold">Strefa rodzica</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-full border px-4 py-2">Wyloguj</button>
            </form>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Dzieci</h2>
          {kids.length === 0 && <p className="text-slate-500">Dodaj pierwsze dziecko poniżej.</p>}
          <ul className="space-y-4">
            {kids.map((k) => {
              const mine = rows.filter((r) => r.childId === k.id);
              const lessons = LESSONS.filter((l) => l.lang === k.lang);
              const stars = mine.reduce((s, r) => s + r.stars, 0);
              const done = mine.filter((r) => r.completed).length;
              return (
                <li key={k.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow">
                  <span className="text-5xl">{k.avatar}</span>
                  <div className="flex-1">
                    <p className="text-xl font-bold">
                      {k.name}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        ({k.lang === "pl" ? "polski" : "angielski"}, {THEMES[k.theme]?.name ?? k.theme})
                      </span>
                    </p>
                    <p className="text-slate-600">
                      Lekcje: {done}/{lessons.length} · Gwiazdki: {stars}/{lessons.length * 3}
                    </p>
                  </div>
                  <Link href={`/app/play/${k.id}`} className="rounded-full bg-amber-500 px-4 py-2 text-white">
                    Graj
                  </Link>
                  <form action={deleteChild}>
                    <input type="hidden" name="childId" value={k.id} />
                    <button className="rounded-full border px-4 py-2 text-rose-600">Usuń</button>
                  </form>
                </li>
              );
            })}
          </ul>
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
                    <span className="block rounded-2xl border-2 border-transparent p-2 text-4xl peer-checked:border-amber-500 peer-checked:bg-amber-50">
                      {a}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-500">Język nauki</span>
                <select name="lang" className="mt-1 w-full rounded-xl border p-3 text-lg">
                  <option value="pl">Polski</option>
                  <option value="en">Angielski</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-slate-500">Motyw</span>
                <select name="theme" className="mt-1 w-full rounded-xl border p-3 text-lg">
                  {Object.entries(THEMES).map(([key, t]) => (
                    <option key={key} value={key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
