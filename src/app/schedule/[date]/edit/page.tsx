import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getScheduledSession } from "@/db/queries";
import { formatShort } from "@/lib/dates";
import { RoutineEditor } from "@/components/screens/RoutineEditor";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const userId = await requireUserId();
  const session = await getScheduledSession(userId, date);
  if (!session) notFound();

  return (
    <RoutineEditor
      mode="session"
      date={date}
      editableName={false}
      titleText={`${session.routineName} · ${formatShort(date)}`}
      initialName={session.routineName}
      initialExercises={session.exercises}
    />
  );
}
