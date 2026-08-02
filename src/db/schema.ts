import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// Shared JSONB shapes
//
// Nested exercise/set data is stored as JSONB because a workout is always
// read and written as a whole. Identity/history is anchored by `exerciseId`
// (see the `exercises` catalog), not by position, so editing a routine never
// corrupts past history. `name` is denormalized alongside for display.
// ─────────────────────────────────────────────────────────────

export type Unit = "lb" | "kg";

/** A planned exercise slot inside a routine template (or a per-session override). */
export type RoutineExercise = {
  exerciseId: string;
  name: string;
  /** Superset / ordering label, e.g. "A1", "A2", "B1". */
  code: string;
  sets: number;
  reps: number;
  /** null = bodyweight. */
  weight: number | null;
  unit: Unit;
};

/** A single performed set inside a logged workout. */
export type LoggedSet = {
  /** null = bodyweight. */
  weight: number | null;
  unit: Unit;
  reps: number;
  /** null = not recorded. */
  rpe: number | null;
};

/** A performed exercise inside a logged workout. */
export type LoggedExercise = {
  exerciseId: string;
  name: string;
  code: string;
  notes: string;
  sets: LoggedSet[];
};

// ─────────────────────────────────────────────────────────────
// Tables (all rows scoped by `userId` = the signed-in Google account id)
// ─────────────────────────────────────────────────────────────

/** Per-user catalog of distinct movements. History is tied to a row here. */
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("exercises_user_idx").on(t.userId)],
);

/** Reusable workout templates. */
export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    exercises: jsonb("exercises")
      .$type<RoutineExercise[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("routines_user_idx").on(t.userId)],
);

/** The plan / calendar: one routine planned on a given day. */
export const scheduledSessions = pgTable(
  "scheduled_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    /** "Edit this session only" — a per-date copy that overrides the routine. */
    customExercises: jsonb("custom_exercises").$type<RoutineExercise[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("scheduled_user_date_unique").on(t.userId, t.date)],
);

/** Completed workouts (history). */
export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    /** Nullable so history survives routine deletion. */
    routineId: uuid("routine_id").references(() => routines.id, {
      onDelete: "set null",
    }),
    /** Denormalized so the routine's name is preserved in history regardless. */
    routineName: text("routine_name").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    exercises: jsonb("exercises")
      .$type<LoggedExercise[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
  },
  (t) => [uniqueIndex("logs_user_date_unique").on(t.userId, t.date)],
);

// Inferred row types for the data layer.
export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type ScheduledSession = typeof scheduledSessions.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
