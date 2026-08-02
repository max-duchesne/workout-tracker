"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextWorkout, ScheduleEntry } from "@/db/queries";
import type { WorkoutLog } from "@/db/schema";
import type { DayInfo } from "@/lib/calendar";
import { diffDays, formatLong, formatShort, monthGridFromOffset, parseKey, weeksFromToday } from "@/lib/dates";
import { abbrOf, totalSets } from "@/lib/workout";
import { Calendar } from "@/components/Calendar";
import { Sheet } from "@/components/Sheet";
import { DaySheet, type DaySession } from "@/components/DaySheet";
import { DoneSheet } from "@/components/DoneSheet";
import { moveScheduledAction } from "@/app/actions";

const SECTION = "text-[11px] font-semibold tracking-[0.14em] text-faint";
type Pending = { routineId: string; routineName: string; fromDate: string };

export function HomeScreen({
  today,
  todayLong,
  next,
  schedule,
  logs,
}: {
  today: string;
  todayLong: string;
  next: NextWorkout | null;
  schedule: ScheduleEntry[];
  logs: WorkoutLog[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [doneDate, setDoneDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scheduleByDate = new Map(schedule.map((s) => [s.date, s]));
  const logByDate = new Map(logs.map((l) => [l.date, l]));
  const activity: Record<string, DayInfo> = {};
  for (const s of schedule)
    activity[s.date] = { kind: "plan", abbr: abbrOf(s.routineName), hasOverride: s.hasOverride };
  for (const l of logs) activity[l.date] = { kind: "log", abbr: abbrOf(l.routineName) };

  const weekCells = weeksFromToday(3, today).map((k) => ({ key: k, day: parseKey(k).d }));
  const grid = monthGridFromOffset(offset, today);

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
  const startCta = next ? `Start ${next.routineName}` : "Start workout";

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function place(key: string) {
    if (!pending) return;
    const res = await moveScheduledAction(pending.fromDate, key);
    if (res.ok) {
      setPending(null);
      router.refresh();
      flash(`${pending.routineName} → ${formatLong(key)}`);
    } else {
      flash("That day already has a session");
    }
  }

  function onDayTap(key: string) {
    if (pending) return void place(key);
    if (logByDate.has(key)) return void setDoneDate(key);
    if (scheduleByDate.has(key)) setSheetDate(key);
  }

  function onMoveStart(session: DaySession) {
    setPending({ routineId: session.routineId, routineName: session.routineName, fromDate: session.date });
    setSheetDate(null);
  }

  return (
    <div className="safe-top flex min-h-dvh flex-col justify-between gap-4 px-5 pb-[104px]">
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

          {next && (
            <>
              <div className="flex flex-col gap-2">
                {preview.map((e, i) => (
                  <div key={i} className="flex items-baseline gap-2.5">
                    <span className="w-[17px] flex-none text-[10px] font-bold text-faint">{e.code}</span>
                    <span className="flex-1 text-sm font-medium text-ink2">{e.name}</span>
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
                  <span className="text-[13px] text-accent">{expanded ? "⌃" : "⌄"}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {pending && (
        <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-[15px] py-[13px]">
          <span className="flex-1 text-[13px] font-medium leading-snug text-accent">
            Tap a day to move {pending.routineName}
          </span>
          <button
            onClick={() => setPending(null)}
            className="flex-none text-[13px] font-semibold text-accent underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div>
        <div className={`${SECTION} mb-2.5`}>UPCOMING WORKOUTS</div>
        <div className="rounded-3xl bg-surface px-3 pb-3 pt-3.5 shadow-[0_1px_2px_rgba(23,24,26,.05)]">
          <Calendar
            cells={weekCells}
            activity={activity}
            today={today}
            cellHeight={56}
            picking={!!pending}
            onDayTap={onDayTap}
          />
          <button
            onClick={() => {
              setOffset(0);
              setFullOpen(true);
            }}
            className="mt-3 flex w-full items-center justify-between border-t border-line pt-3"
          >
            <span className="text-sm font-semibold text-accent">See full schedule</span>
            <span className="text-[15px] text-accent">›</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => (next ? setStartOpen(true) : router.push("/plan"))}
        className="flex h-[60px] flex-none items-center justify-center rounded-full bg-accent text-[17px] font-semibold tracking-tight text-white shadow-[0_10px_22px_-12px_rgba(47,125,87,.75)] transition-opacity active:opacity-85"
      >
        {startCta}
      </button>

      {/* Start confirm sheet */}
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
            className="flex h-14 items-center justify-center rounded-full bg-accent text-[17px] font-semibold text-white active:opacity-85"
          >
            {startCta}
          </button>
          <button
            onClick={() => setStartOpen(false)}
            className="flex h-[52px] items-center justify-center rounded-full bg-page text-base font-semibold text-ink2"
          >
            Cancel
          </button>
        </div>
      </Sheet>

      {/* Full schedule popup */}
      {fullOpen && (
        <>
          <div
            onClick={() => setFullOpen(false)}
            className="fixed inset-0 z-30 bg-black/30"
            style={{ animation: "fadeIn .18s ease" }}
          />
          <div
            className="safe-bottom fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-surface px-[18px] pb-6 pt-5 shadow-[0_-20px_50px_-20px_rgba(23,24,26,.3)]"
            style={{ animation: "sheetIn .28s cubic-bezier(.32,.72,0,1)" }}
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[#E4E2DD]" />
            <div className="mb-3.5 flex items-center justify-between">
              <button
                onClick={() => setOffset((o) => o - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-page text-base text-ink2"
              >
                ‹
              </button>
              <span className="text-[17px] font-bold tracking-tight text-ink">{grid.label}</span>
              <button
                onClick={() => setOffset((o) => o + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-page text-base text-ink2"
              >
                ›
              </button>
            </div>
            {pending && (
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-accent-soft px-[14px] py-[11px]">
                <span className="flex-1 text-[12.5px] font-medium leading-snug text-accent">
                  Tap a day to move {pending.routineName}
                </span>
                <button
                  onClick={() => setPending(null)}
                  className="flex-none text-[12.5px] font-semibold text-accent underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <Calendar
              cells={grid.cells}
              activity={activity}
              today={today}
              picking={!!pending}
              onDayTap={onDayTap}
            />
            <button
              onClick={() => setFullOpen(false)}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-page text-base font-semibold text-ink2 active:bg-[#EAE8E4]"
            >
              Done
            </button>
          </div>
        </>
      )}

      <DaySheet
        session={sheetDate ? (scheduleByDate.get(sheetDate) as DaySession) : null}
        onClose={() => setSheetDate(null)}
        onMoveStart={onMoveStart}
      />
      <DoneSheet
        log={doneDate ? (logByDate.get(doneDate) ?? null) : null}
        onClose={() => setDoneDate(null)}
      />

      {toast && (
        <div
          className="fixed inset-x-4 bottom-[110px] z-[60] flex items-center gap-3 rounded-[17px] bg-ink px-[18px] py-[15px] shadow-[0_16px_34px_-14px_rgba(23,24,26,.5)]"
          style={{ animation: "toastIn .22s ease" }}
        >
          <div className="h-[7px] w-[7px] flex-none rounded-full bg-[#5FCB92]" />
          <span className="flex-1 text-sm font-medium text-white">{toast}</span>
        </div>
      )}
    </div>
  );
}
