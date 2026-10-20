import { notFound, redirect } from "next/navigation";
import { getOwnChild, getUser } from "@/actions/children";
import { loadStates } from "@/actions/engine";
import { compose, composeProbe } from "@/engine/composer";
import { WORLDS } from "@/engine/content";
import SessionRunner from "@/components/SessionRunner";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: PageProps<"/app/play/[childId]/session/[worldId]">) {
  const user = await getUser();
  if (!user) redirect("/");
  const { childId, worldId } = await params;
  const child = await getOwnChild(childId);
  const world = WORLDS[worldId];
  if (!child || !world) notFound();

  const states = await loadStates(child.id);
  const probe = Object.keys(states).length === 0;
  const number = (child.session_count ?? 0) + 1;
  const session = probe ? composeProbe(world.id, Math.random) : compose(states, world.id, number, new Date(), Math.random);
  session.number = number;

  const collected = child.collection?.[world.id] ?? 0;

  return (
    <div className={`min-h-dvh bg-gradient-to-b ${world.bg}`}>
      <SessionRunner child={{ id: child.id, name: child.name, avatar: child.avatar }} world={world} session={session} collected={collected} />
    </div>
  );
}
