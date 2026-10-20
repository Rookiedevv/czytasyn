import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOwnChild } from "@/actions/children";
import { getLesson, THEMES } from "@/content/lessons";
import LessonRunner from "@/components/LessonRunner";

export default async function LessonPage({ params }: PageProps<"/app/play/[childId]/[lessonId]">) {
  const session = await auth();
  if (!session?.user) redirect("/");
  const { childId, lessonId } = await params;
  const child = await getOwnChild(childId);
  const lesson = getLesson(lessonId);
  if (!child || !lesson) notFound();

  const theme = THEMES[child.theme] ?? THEMES.forest;

  return (
    <div className={`min-h-dvh bg-gradient-to-b ${theme.bg}`}>
      <LessonRunner lesson={lesson} childId={child.id} childName={child.name} accentClass={theme.accent} />
    </div>
  );
}
