import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOwnChild, getUser } from "@/actions/children";
import { loadStates } from "@/actions/engine";
import { WORLDS } from "@/engine/content";
import { masteredGraphemes, practisingGraphemes } from "@/engine/model";
import CollectionGrid from "@/components/CollectionGrid";

export default async function CollectionPage({ params }: PageProps<"/app/play/[childId]/collection/[worldId]">) {
  const user = await getUser();
  if (!user) redirect("/");
  const { childId, worldId } = await params;
  const child = await getOwnChild(childId);
  const world = WORLDS[worldId];
  if (!child || !world) notFound();
  const states = await loadStates(child.id);
  const known = [...masteredGraphemes(states), ...practisingGraphemes(states)];
  const n = child.collection?.[world.id] ?? 0;

  return (
    <main className={`relative flex min-h-dvh flex-col items-center gap-8 bg-gradient-to-b ${world.bg} p-8 pt-24 text-center select-none`}>
      <Link href={`/app/play/${child.id}`} className="absolute left-6 top-6 rounded-full bg-white/70 px-5 py-3 text-2xl shadow">
        ←
      </Link>
      <h1 className={`rounded-full px-6 py-2 text-4xl font-extrabold ${world.chip}`}>
        {world.mascot} {world.name}: moja kolekcja {n}/{world.collection.length}
      </h1>
      <CollectionGrid world={world} unlocked={n} known={known} />
      <Link
        href={`/app/play/${child.id}/session/${world.id}`}
        className={`rounded-full px-10 py-5 text-3xl font-bold shadow-xl active:scale-95 ${world.accent}`}
      >
        Następna sesja
      </Link>
    </main>
  );
}
