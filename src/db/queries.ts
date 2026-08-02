import "server-only";
import { and, asc, desc, eq, gte, lt, notInArray, sql } from "drizzle-orm";
import { abbrOf } from "@/lib/workout";
import { getDb } from "./index";
import {
  exercises,
  routines,
  scheduledSessions,
  workoutLogs,
  type LoggedExercise,
  type LoggedSet,
  type Routine,
  type RoutineExercise,
  type Unit,
  type WorkoutLog,
} from "./schema";

// ─────────────────────────────────────────────────────────────
// Exercise catalog — history is anchored here, not to routine position.
// ─────────────────────────────────────────────────────────────

/** Find (case-insensitive) or create a catalog exercise; returns its id. */
export async function resolveExerciseId(userId: string, name: string): Promise<string> {
  const db = getDb();
  const trimmed = name.trim() || "Untitled";
  const [existing] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        eq(exercises.userId, userId),
        sql`lower(${exercises.name}) = ${trimmed.toLowerCase()}`,
      ),
    )
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(exercises)
    .values({ userId, name: trimmed })
    .returning({ id: exercises.id });
  return created.id;
}

/** Resolve exerciseId for each entry (by current name) and normalize shape. */
async function withExerciseIds(
  userId: string,
  list: Array<Omit<RoutineExercise, "exerciseId"> & { exerciseId?: string }>,
): Promise<RoutineExercise[]> {
  const out: RoutineExercise[] = [];
  for (const e of list) {
    out.push({
      exerciseId: e.exerciseId || (await resolveExerciseId(userId, e.name)),
      name: e.name.trim(),
      code: e.code,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      unit: e.unit,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Routines
// ─────────────────────────────────────────────────────────────

export async function listRoutines(userId: string): Promise<Routine[]> {
  const db = getDb();
  return db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(asc(routines.position), asc(routines.createdAt));
}

export async function getRoutine(userId: string, id: string): Promise<Routine | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createRoutine(userId: string, name = "New routine"): Promise<Routine> {
  const db = getDb();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${routines.position}), -1)` })
    .from(routines)
    .where(eq(routines.userId, userId));
  const [row] = await db
    .insert(routines)
    .values({ userId, name, position: (max ?? -1) + 1, exercises: [] })
    .returning();
  return row;
}

export async function updateRoutine(
  userId: string,
  id: string,
  patch: { name?: string; exercises?: Array<Omit<RoutineExercise, "exerciseId"> & { exerciseId?: string }> },
): Promise<void> {
  const db = getDb();
  const set: Partial<typeof routines.$inferInsert> = {};
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.exercises !== undefined) set.exercises = await withExerciseIds(userId, patch.exercises);
  if (Object.keys(set).length === 0) return;
  await db
    .update(routines)
    .set(set)
    .where(and(eq(routines.userId, userId), eq(routines.id, id)));
}

export async function deleteRoutine(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db.delete(routines).where(and(eq(routines.userId, userId), eq(routines.id, id)));
}

// ─────────────────────────────────────────────────────────────
// Schedule (the plan / calendar)
// ─────────────────────────────────────────────────────────────

export type ScheduleEntry = {
  date: string;
  routineId: string;
  routineName: string;
  hasOverride: boolean;
};

/** Scheduled sessions in [fromKey, toKey], joined with routine name. */
export async function getSchedule(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<ScheduleEntry[]> {
  const db = getDb();
  const rows = await db
    .select({
      date: scheduledSessions.date,
      routineId: scheduledSessions.routineId,
      routineName: routines.name,
      custom: scheduledSessions.customExercises,
    })
    .from(scheduledSessions)
    .innerJoin(routines, eq(scheduledSessions.routineId, routines.id))
    .where(
      and(
        eq(scheduledSessions.userId, userId),
        gte(scheduledSessions.date, fromKey),
        lt(scheduledSessions.date, toKey),
      ),
    )
    .orderBy(asc(scheduledSessions.date));
  return rows.map((r) => ({
    date: r.date,
    routineId: r.routineId,
    routineName: r.routineName,
    hasOverride: r.custom !== null,
  }));
}

/** The scheduled session on a given day, with the effective exercise list. */
export async function getScheduledSession(userId: string, date: string) {
  const db = getDb();
  const [row] = await db
    .select({
      date: scheduledSessions.date,
      routineId: scheduledSessions.routineId,
      routineName: routines.name,
      routineExercises: routines.exercises,
      custom: scheduledSessions.customExercises,
    })
    .from(scheduledSessions)
    .innerJoin(routines, eq(scheduledSessions.routineId, routines.id))
    .where(and(eq(scheduledSessions.userId, userId), eq(scheduledSessions.date, date)))
    .limit(1);
  if (!row) return null;
  return {
    date: row.date,
    routineId: row.routineId,
    routineName: row.routineName,
    hasOverride: row.custom !== null,
    exercises: row.custom ?? row.routineExercises,
  };
}

/** Schedule a routine on a date. Returns false if that day is already taken. */
export async function addScheduled(userId: string, routineId: string, date: string): Promise<boolean> {
  const db = getDb();
  const inserted = await db
    .insert(scheduledSessions)
    .values({ userId, routineId, date })
    .onConflictDoNothing({ target: [scheduledSessions.userId, scheduledSessions.date] })
    .returning({ id: scheduledSessions.id });
  return inserted.length > 0;
}

/** Move a scheduled session to another day (carrying its override). */
export async function moveScheduled(userId: string, fromDate: string, toDate: string): Promise<boolean> {
  const db = getDb();
  if (await isDayTaken(userId, toDate)) return false;
  const updated = await db
    .update(scheduledSessions)
    .set({ date: toDate })
    .where(and(eq(scheduledSessions.userId, userId), eq(scheduledSessions.date, fromDate)))
    .returning({ id: scheduledSessions.id });
  return updated.length > 0;
}

export async function removeScheduled(userId: string, date: string): Promise<void> {
  const db = getDb();
  await db
    .delete(scheduledSessions)
    .where(and(eq(scheduledSessions.userId, userId), eq(scheduledSessions.date, date)));
}

/** Set (or clear) the per-session "edit this session only" override. */
export async function setSessionOverride(
  userId: string,
  date: string,
  exercises: Array<Omit<RoutineExercise, "exerciseId"> & { exerciseId?: string }> | null,
): Promise<void> {
  const db = getDb();
  await db
    .update(scheduledSessions)
    .set({ customExercises: exercises === null ? null : await withExerciseIds(userId, exercises) })
    .where(and(eq(scheduledSessions.userId, userId), eq(scheduledSessions.date, date)));
}

async function isDayTaken(userId: string, date: string): Promise<boolean> {
  const db = getDb();
  const [sched] = await db
    .select({ id: scheduledSessions.id })
    .from(scheduledSessions)
    .where(and(eq(scheduledSessions.userId, userId), eq(scheduledSessions.date, date)))
    .limit(1);
  if (sched) return true;
  const [log] = await db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.date, date)))
    .limit(1);
  return !!log;
}

// ─────────────────────────────────────────────────────────────
// History (completed workouts)
// ─────────────────────────────────────────────────────────────

export type LogSummary = {
  date: string;
  routineName: string;
  exerciseCount: number;
};

export async function getLogs(userId: string, fromKey: string, toKey: string): Promise<LogSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ date: workoutLogs.date, routineName: workoutLogs.routineName, exercises: workoutLogs.exercises })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.date, fromKey), lt(workoutLogs.date, toKey)))
    .orderBy(desc(workoutLogs.date));
  return rows.map((r) => ({
    date: r.date,
    routineName: r.routineName,
    exerciseCount: r.exercises.length,
  }));
}

export type DayActivity = { kind: "log" | "plan"; abbr: string; hasOverride: boolean };

/** Combined per-day activity for calendars in [fromKey, toKey]. Logged days win. */
export async function getActivityMap(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<Record<string, DayActivity>> {
  const [sched, logs] = await Promise.all([
    getSchedule(userId, fromKey, toKey),
    getLogs(userId, fromKey, toKey),
  ]);
  const map: Record<string, DayActivity> = {};
  for (const s of sched) {
    map[s.date] = { kind: "plan", abbr: abbrOf(s.routineName), hasOverride: s.hasOverride };
  }
  for (const l of logs) {
    map[l.date] = { kind: "log", abbr: abbrOf(l.routineName), hasOverride: false };
  }
  return map;
}

/** Full log rows in a range (for calendars + the completed-session popup). */
export async function getWorkoutLogsInRange(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<WorkoutLog[]> {
  const db = getDb();
  return db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.date, fromKey), lt(workoutLogs.date, toKey)))
    .orderBy(desc(workoutLogs.date));
}

export async function getLogByDate(userId: string, date: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.date, date)))
    .limit(1);
  return row ?? null;
}

// ─────────────────────────────────────────────────────────────
// "Next workout" + live workout assembly (plan + last-time hints)
// ─────────────────────────────────────────────────────────────

export type NextWorkout = {
  date: string;
  routineId: string;
  routineName: string;
  exercises: RoutineExercise[];
  hasOverride: boolean;
};

/** Earliest scheduled day on/after `today` that hasn't been logged yet. */
export async function getNextWorkout(userId: string, today: string): Promise<NextWorkout | null> {
  const db = getDb();
  const loggedDates = db
    .select({ date: workoutLogs.date })
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, userId));
  const [row] = await db
    .select({
      date: scheduledSessions.date,
      routineId: scheduledSessions.routineId,
      routineName: routines.name,
      routineExercises: routines.exercises,
      custom: scheduledSessions.customExercises,
    })
    .from(scheduledSessions)
    .innerJoin(routines, eq(scheduledSessions.routineId, routines.id))
    .where(
      and(
        eq(scheduledSessions.userId, userId),
        gte(scheduledSessions.date, today),
        notInArray(scheduledSessions.date, loggedDates),
      ),
    )
    .orderBy(asc(scheduledSessions.date))
    .limit(1);
  if (!row) return null;
  return {
    date: row.date,
    routineId: row.routineId,
    routineName: row.routineName,
    exercises: row.custom ?? row.routineExercises,
    hasOverride: row.custom !== null,
  };
}

/** Most recent logged sets for an exercise before `beforeKey` (last-time hint). */
export async function getLastPerformance(
  userId: string,
  exerciseId: string,
  beforeKey: string,
): Promise<{ date: string; sets: LoggedSet[] } | null> {
  const db = getDb();
  const logs = await db
    .select({ date: workoutLogs.date, exercises: workoutLogs.exercises })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), lt(workoutLogs.date, beforeKey)))
    .orderBy(desc(workoutLogs.date))
    .limit(60);
  for (const log of logs) {
    const match = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (match) return { date: log.date, sets: match.sets };
  }
  return null;
}

export type ActiveExercise = {
  exerciseId: string;
  code: string;
  name: string;
  unit: Unit;
  plan: { sets: number; reps: number; weight: number | null; unit: Unit };
  last: { date: string; sets: LoggedSet[] } | null;
};

export type ActiveWorkout = {
  date: string;
  routineId: string;
  routineName: string;
  exercises: ActiveExercise[];
};

/** Assemble the live workout for a scheduled day: plan + per-exercise last-time. */
export async function buildActiveWorkout(userId: string, date: string): Promise<ActiveWorkout | null> {
  const session = await getScheduledSession(userId, date);
  if (!session) return null;
  const exercises: ActiveExercise[] = [];
  for (const e of session.exercises) {
    const last = await getLastPerformance(userId, e.exerciseId, date);
    exercises.push({
      exerciseId: e.exerciseId,
      code: e.code,
      name: e.name,
      unit: e.unit,
      plan: { sets: e.sets, reps: e.reps, weight: e.weight, unit: e.unit },
      last,
    });
  }
  return {
    date: session.date,
    routineId: session.routineId,
    routineName: session.routineName,
    exercises,
  };
}

/** Persist a completed workout (upsert on the day). Resolves any new exercises. */
export async function saveWorkoutLog(
  userId: string,
  input: {
    date: string;
    routineId: string | null;
    routineName: string;
    startedAt?: Date | null;
    exercises: Array<Omit<LoggedExercise, "exerciseId"> & { exerciseId?: string }>;
  },
): Promise<void> {
  const db = getDb();
  const exercisesResolved: LoggedExercise[] = [];
  for (const e of input.exercises) {
    exercisesResolved.push({
      exerciseId: e.exerciseId || (await resolveExerciseId(userId, e.name)),
      name: e.name.trim(),
      code: e.code,
      notes: e.notes,
      sets: e.sets,
    });
  }
  const values = {
    userId,
    routineId: input.routineId,
    routineName: input.routineName,
    date: input.date,
    startedAt: input.startedAt ?? null,
    completedAt: new Date(),
    exercises: exercisesResolved,
  };
  await db
    .insert(workoutLogs)
    .values(values)
    .onConflictDoUpdate({
      target: [workoutLogs.userId, workoutLogs.date],
      set: {
        routineId: values.routineId,
        routineName: values.routineName,
        startedAt: values.startedAt,
        completedAt: values.completedAt,
        exercises: values.exercises,
      },
    });
}
