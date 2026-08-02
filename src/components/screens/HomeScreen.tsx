"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DayInfo } from "@/lib/calendar";
import type { MonthGridCell } from "@/lib/dates";
import type { NextWorkout } from "@/db/queries";
import { diffDays, formatShort } from "@/lib/dates";
import { totalSets } from "@/lib/workout";
import { Calendar } from "@/components/Calendar";
import { Sheet } from "@/components/Sheet";

const SECTION = "text-[11px] font-semibold tracking-[0.14em] text-faint";

export function HomeScreen({
  today,
  todayLong,
  next,
  weekCells,
  activity,
}: {
  today: string;
  todayLong: string;
  next: NextWorkout | null;
  weekCells: MonthGridCell[];
  activity: Record<string, DayInfo>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const diff = next ? diffDays(next.date, today) : 0;
  const whenLabel = !next
    ? "REST"
    : diff === 0
      ? "TODAY"
      : diff === 1
        ? "TOMORROW"
        : formatShort(next.date).toUpperCase();
  const setCount = next ? totalSets(next.exercises) : 0;
  const preview = next ? (expanded ? next.exercises : next.exercises.slice(0, 3)) : [];

  function onDayTap(key: string) {
    if (activity[key]?.kind === "log") router.push(`/session/${key}`);
  }

  return (
    <div className="safe-top flex min-h-full flex-col justify-between gap-4 px-5 pb-3">
      <div className="pt-2">
        <div className={SECTION}>TODAY</div>
        <div className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-ink">
          {todayLong}
        </div>
      </div>

      <div>
        <div className={`${SECTION} mb-2.5`}>NEXT WORKOUT</div>
        <div className="rounded-3xl bg-surface p-[18px] shadow-[0_1px_2px_rgba(23,24,26,.05),0_14px_30px_-18px_rgba(23,24,26,.18)]">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-tan-soft px-[9px] py-1.5 text-[10px] font-bold tracking-wider text-tan-ink">
              {whenLabel}
            </span>
            {next && (
              <span className="text-xs font-medium text-muted">
                {next.exercises.length} exercises · {setCount} sets
              </span>
            )}
          </div>
          <div className="my-3 text-[22px] font-bold leading-tight tracking-tight text-ink">
            {next ? next.routineName : "Nothing scheduled"}
          </div>

          {next ? (
            <>
              <div className="flex flex-col gap-2">
                {preview.map((e, i) => (
                  <div key={i} className="flex items-baseline gap-2.5">
                    <span className="w-[17px] flex-none text-[10px] font-bold text-faint">
                      {e.code}
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink2">
                      {e.name}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted">
                      {e.sets} × {e.reps}
                    </span>
                  </div>
                ))}
              </div>
              {next.exercises.length > 0 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-4 flex w-full items-center justify-between border-t border-line pt-3"
                >
                  <span className="text-[13.5px] font-semibold text-accent">
                    {expanded
                      ? "Show less"
                      : next.exercises.length > 3
                        ? `Show all ${next.exercises.length} exercises`
                        : "Show details"}
                  </span>
                  <span className="text-[13px] text-accent">
                    {expanded ? "⌃" : "⌄"}
                  </span>
                </button>
              )}
            </>
          ) : (
            <Link
              href="/plan"
              className="text-[13.5px] font-semibold text-accent"
            >
              Add a session from the Plan tab →
            </Link>
          )}
        </div>
      </div>

      <div>
        <div className={`${SECTION} mb-2.5`}>UPCOMING WORKOUTS</div>
        <div className="rounded-3xl bg-surface px-3 pb-3 pt-3.5 shadow-[0_1px_2px_rgba(23,24,26,.05)]">
          <Calendar
            cells={weekCells}
            activity={activity}
            today={today}
            cellHeight={56}
            onDayTap={onDayTap}
          />
          <Link
            href="/plan"
            className="mt-3 flex items-center justify-between border-t border-line pt-3"
          >
            <span className="text-sm font-semibold text-accent">
              See full schedule
            </span>
            <span className="text-[15px] text-accent">›</span>
          </Link>
        </div>
      </div>

      <button
        onClick={() => (next ? setStartOpen(true) : router.push("/plan"))}
        className="flex h-[60px] flex-none items-center justify-center rounded-[19px] bg-ink text-[17px] font-semibold tracking-tight text-white shadow-[0_10px_22px_-12px_rgba(23,24,26,.55)] transition-opacity active:opacity-85"
      >
        Start workout
      </button>

      <Sheet open={startOpen} onClose={() => setStartOpen(false)}>
        <div className="text-center text-[21px] font-bold tracking-tight text-ink">
          Start {next?.routineName}?
        </div>
        <div className="mt-2 text-center text-sm font-medium text-muted">
          {next?.exercises.length} exercises · {setCount} sets
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => next && router.push(`/workout/${next.date}`)}
            className="flex h-14 items-center justify-center rounded-[19px] bg-ink text-[17px] font-semibold text-white active:opacity-85"
          >
            Start {next?.routineName}
          </button>
          <button
            onClick={() => setStartOpen(false)}
            className="flex h-[52px] items-center justify-center rounded-[18px] bg-page text-base font-semibold text-ink2"
          >
            Cancel
          </button>
        </div>
      </Sheet>
    </div>
  );
}
