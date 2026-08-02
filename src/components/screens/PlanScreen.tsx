"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleEntry } from "@/db/queries";
import type { WorkoutLog } from "@/db/schema";
import type { DayInfo } from "@/lib/calendar";
import { formatLong, monthGridFromOffset } from "@/lib/dates";
import { abbrOf } from "@/lib/workout";
import { Calendar } from "@/components/Calendar";
import { Sheet } from "@/components/Sheet";
import { DaySheet, type DaySession } from "@/components/DaySheet";
import { DoneSheet } from "@/components/DoneSheet";
import { addScheduledAction, createRoutineAction, moveScheduledAction } from "@/app/actions";

type RoutineRef = { id: string; name: string };
type Pending =
  | { mode: "add"; routineId: string; routineName: string }
  | { mode: "move"; routineId: string; routineName: string; fromDate: string };

const sheetRow =
  "flex h-[54px] items-center justify-between rounded-[18px] bg-page px-[18px] active:bg-[#EAE8E4]";

export function PlanScreen({
  today,
  routines,
  schedule,
  logs,
}: {
  today: string;
  routines: RoutineRef[];
  schedule: ScheduleEntry[];
  logs: WorkoutLog[];
}) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sheet, setSheet] = useState<"add" | "pick" | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [doneDate, setDoneDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scheduleByDate = new Map(schedule.map((s) => [s.date, s]));
  const logByDate = new Map(logs.map((l) => [l.date, l]));
  const activity: Record<string, DayInfo> = {};
  for (const s of schedule)
    activity[s.date] = { kind: "plan", abbr: abbrOf(s.routineName), hasOverride: s.hasOverride };
  for (const l of logs) activity[l.date] = { kind: "log", abbr: abbrOf(l.routineName) };

  const grid = monthGridFromOffset(offset, today);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function place(key: string) {
    if (!pending) return;
    const res =
      pending.mode === "add"
        ? await addScheduledAction(pending.routineId, key)
        : await moveScheduledAction(pending.fromDate, key);
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
    setPending({
      mode: "move",
      routineId: session.routineId,
      routineName: session.routineName,
      fromDate: session.date,
    });
    setSheetDate(null);
  }

  return (
    <div className="safe-top px-5 pb-[104px]">
      <div className="flex items-start justify-between gap-3 pt-2">
        <h1 className="text-[27px] font-bold tracking-tight text-ink">Workout plan</h1>
        <button
          onClick={() => setSheet("add")}
          className="flex h-[38px] flex-none items-center gap-1.5 rounded-full bg-ink px-4 active:opacity-85"
        >
          <span className="text-[15px] font-medium text-white">+</span>
          <span className="text-[13px] font-semibold text-white">Add</span>
        </button>
      </div>

      {pending && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-soft px-[15px] py-[13px]">
          <span className="flex-1 text-[13px] font-medium leading-snug text-accent">
            Tap a day to {pending.mode === "move" ? "move" : "add"} {pending.routineName}
          </span>
          <button
            onClick={() => setPending(null)}
            className="flex-none text-[13px] font-semibold text-accent underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="my-3 flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(23,24,26,.08)] bg-surface text-base text-ink2"
        >
          ‹
        </button>
        <span className="text-base font-semibold text-ink">{grid.label}</span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(23,24,26,.08)] bg-surface text-base text-ink2"
        >
          ›
        </button>
      </div>

      <div className="rounded-3xl bg-surface px-3 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(23,24,26,.05)]">
        <Calendar
          cells={grid.cells}
          activity={activity}
          today={today}
          picking={!!pending}
          onDayTap={onDayTap}
        />
      </div>

      <div className="mb-2.5 mt-6 text-[11px] font-semibold tracking-[0.12em] text-faint">
        ROUTINES
      </div>
      <div className="flex flex-col gap-2 pb-2">
        {routines.length === 0 && (
          <div className="py-2 text-center text-[13px] text-faint">
            No routines yet. Tap Add → Create new routine.
          </div>
        )}
        {routines.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/routines/${t.id}/edit`)}
            className="flex items-center gap-3 rounded-[18px] bg-surface p-[17px] text-left shadow-[0_1px_2px_rgba(23,24,26,.04)] active:bg-[#FAF9F7]"
          >
            <span className="flex-1 text-[15px] font-semibold text-ink">{t.name}</span>
            <span className="text-base text-[#C6C3BC]">›</span>
          </button>
        ))}
      </div>

      {/* Add sheet */}
      <Sheet open={sheet === "add"} onClose={() => setSheet(null)}>
        <div className="text-[21px] font-bold tracking-tight text-ink">Add</div>
        <div className="mt-5 flex flex-col gap-2">
          <button className={sheetRow} onClick={() => setSheet("pick")}>
            <span className="text-[15px] font-semibold text-ink">Add workout to schedule</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
          <button className={sheetRow} onClick={() => createRoutineAction()}>
            <span className="text-[15px] font-semibold text-ink">Create new routine</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
        </div>
      </Sheet>

      {/* Pick routine sheet */}
      <Sheet open={sheet === "pick"} onClose={() => setSheet(null)}>
        <div className="text-[21px] font-bold tracking-tight text-ink">Add workout to schedule</div>
        <div className="mt-5 flex flex-col gap-2">
          {routines.length === 0 && (
            <div className="py-2 text-center text-[13px] text-faint">Create a routine first.</div>
          )}
          {routines.map((t) => (
            <button
              key={t.id}
              className={sheetRow}
              onClick={() => {
                setPending({ mode: "add", routineId: t.id, routineName: t.name });
                setSheet(null);
              }}
            >
              <span className="text-[15px] font-semibold text-ink">{t.name}</span>
              <span className="text-[15px] text-[#C6C3BC]">›</span>
            </button>
          ))}
        </div>
      </Sheet>

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
