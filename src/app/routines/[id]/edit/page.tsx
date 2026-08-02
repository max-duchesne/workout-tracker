import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getRoutine } from "@/db/queries";
import { RoutineEditor } from "@/components/screens/RoutineEditor";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const routine = await getRoutine(userId, id);
  if (!routine) notFound();

  return (
    <RoutineEditor
      mode="routine"
      routineId={routine.id}
      editableName
      initialName={routine.name}
      initialExercises={routine.exercises}
    />
  );
}
