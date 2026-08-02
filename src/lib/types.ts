import type { RoutineExercise, Unit } from "@/db/schema";

/** A routine/session exercise as edited in the UI (exerciseId resolved on save). */
export type EditorExercise = Omit<RoutineExercise, "exerciseId"> & {
  exerciseId?: string;
};

/** Raw set inputs during a live workout (strings straight from the inputs). */
export type LiveSetInput = { w: string; r: string; rpe: string };

export type SubmitExercise = {
  exerciseId?: string;
  name: string;
  code: string;
  notes: string;
  unit: Unit;
  sets: LiveSetInput[];
};

export type SubmitWorkoutInput = {
  date: string;
  routineId: string | null;
  routineName: string;
  startedAt?: string | null;
  exercises: SubmitExercise[];
};
