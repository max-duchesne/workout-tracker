"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import * as q from "@/db/queries";
import type { LoggedSet } from "@/db/schema";
import type { EditorExercise, SubmitWorkoutInput } from "@/lib/types";

// ── Routines ────────────────────────────────────────────────

export async function createRoutineAction() {
  const userId = await requireUserId();
  const routine = await q.createRoutine(userId);
  redirect(`/routines/${routine.id}/edit`);
}

export async function saveRoutineAction(input: {
  id: string;
  name: string;
  exercises: EditorExercise[];
}) {
  const userId = await requireUserId();
  await q.updateRoutine(userId, input.id, {
    name: input.name,
    exercises: input.exercises,
  });
  revalidatePath("/plan");
  revalidatePath("/");
  redirect("/plan");
}

export async function deleteRoutineAction(id: string) {
  const userId = await requireUserId();
  await q.deleteRoutine(userId, id);
  revalidatePath("/plan");
  revalidatePath("/");
  redirect("/plan");
}

// ── Schedule ────────────────────────────────────────────────

export async function addScheduledAction(routineId: string, date: string) {
  const userId = await requireUserId();
  const ok = await q.addScheduled(userId, routineId, date);
  revalidatePath("/plan");
  revalidatePath("/");
  return { ok };
}

export async function moveScheduledAction(fromDate: string, toDate: string) {
  const userId = await requireUserId();
  const ok = await q.moveScheduled(userId, fromDate, toDate);
  revalidatePath("/plan");
  revalidatePath("/");
  return { ok };
}

export async function removeScheduledAction(date: string) {
  const userId = await requireUserId();
  await q.removeScheduled(userId, date);
  revalidatePath("/plan");
  revalidatePath("/");
}

/** Save (or clear) a per-session "edit this session only" override. */
export async function saveSessionOverrideAction(input: {
  date: string;
  exercises: EditorExercise[] | null;
}) {
  const userId = await requireUserId();
  await q.setSessionOverride(userId, input.date, input.exercises);
  revalidatePath("/plan");
  revalidatePath("/");
  redirect("/plan");
}

// ── Workout logging ─────────────────────────────────────────

export async function submitWorkoutAction(input: SubmitWorkoutInput) {
  const userId = await requireUserId();

  const exercises = input.exercises
    .map((e) => {
      const sets: LoggedSet[] = [];
      for (const s of e.sets) {
        const w = s.w.trim();
        const r = s.r.trim();
        if (w === "" && r === "") continue; // untouched sets aren't logged
        const wn = parseFloat(w);
        sets.push({
          weight: w === "" ? null : Number.isNaN(wn) ? 0 : wn,
          unit: e.unit,
          reps: r === "" ? 0 : parseInt(r, 10) || 0,
          rpe: s.rpe.trim() === "" ? null : parseFloat(s.rpe),
        });
      }
      return { exerciseId: e.exerciseId, name: e.name, code: e.code, notes: e.notes, sets };
    })
    .filter((e) => e.sets.length > 0);

  await q.saveWorkoutLog(userId, {
    date: input.date,
    routineId: input.routineId,
    routineName: input.routineName,
    startedAt: input.startedAt ? new Date(input.startedAt) : null,
    exercises,
  });

  revalidatePath("/");
  revalidatePath("/history");
  redirect("/");
}
