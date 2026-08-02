import type { RoutineExercise, Unit } from "@/db/schema";

/** Two-char calendar tag derived from a routine name, e.g. "Lower #1" → "L1". */
export function abbrOf(name: string): string {
  const letter = (name.match(/[A-Za-z]/) || ["R"])[0].toUpperCase();
  const num = (name.match(/\d/) || [""])[0];
  return letter + num;
}

/** Convert a weight between units (rounded), matching the design. 1 lb = 0.4536 kg. */
export function convWeight(v: number, from: Unit, to: Unit): number {
  if (from === to) return v;
  return to === "kg" ? Math.round(v * 0.4536) : Math.round(v / 0.4536);
}

/** Total planned sets across a routine's exercises. */
export function totalSets(exercises: Pick<RoutineExercise, "sets">[]): number {
  return exercises.reduce((sum, e) => sum + e.sets, 0);
}

/** Next superset code following the last row, e.g. "A1" → "A2". */
export function nextCode(list: Pick<RoutineExercise, "code">[]): string {
  const last = list[list.length - 1];
  if (!last) return "A1";
  const letter = last.code.charAt(0);
  const n = parseInt(last.code.slice(1), 10);
  return Number.isNaN(n) ? "A1" : `${letter}${n + 1}`;
}

/** "4 × 5 · 185 lb" style scheme label for an exercise plan. */
export function schemeLabel(e: Pick<RoutineExercise, "sets" | "reps" | "weight" | "unit">): string {
  const load = e.weight === null ? "bodyweight" : `${e.weight} ${e.unit}`;
  return `${e.sets} × ${e.reps} · ${load}`;
}
