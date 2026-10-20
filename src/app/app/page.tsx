import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, listChildren } from "@/actions/children";
import PendingSync from "@/components/PendingSync";

export default async function ChildPicker() {
  const user = await getUser();
  if (!user) redirect("/");
  const kids = await listChildren();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-gradient-to-b from-amber-200 to-orange-100 p-8 text-center select-none">
      <PendingSync />
      <Link
        href="/app/parent"
        className="absolute right-6 top-6 rounded-full bg-white/70 px-5 py-3 text-lg text-slate-600 shadow"
      >
        👤 Rodzic
      </Link>

      <h1 className="text-5xl font-extrabold text-amber-900">Kto dziś czyta?</h1>

      {kids.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl text-amber-900/70">Nie ma jeszcze żadnego dziecka.</p>
          <Link
            href="/app/parent"
            className="rounded-full bg-amber-500 px-10 py-5 text-2xl font-bold text-white shadow-xl"
          >
            Dodaj dziecko
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          {kids.map((k) => (
            <Link
              key={k.id}
              href={`/app/play/${k.id}`}
              className="flex w-56 flex-col items-center gap-3 rounded-[2.5rem] bg-white p-8 shadow-xl transition active:scale-95"
            >
              <span className="text-8xl">{k.avatar}</span>
              <span className="text-3xl font-bold text-slate-800">{k.name}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
