"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LogSummary, ScheduleEntry } from "@/db/queries";
import type { DayInfo } from "@/lib/calendar";
import { formatLong, monthGridFromOffset } from "@/lib/dates";
import { abbrOf } from "@/lib/workout";
import { Calendar } from "@/components/Calendar";
import { Sheet } from "@/components/Sheet";
import {
  addScheduledAction,
  createRoutineAction,
  moveScheduledAction,
  removeScheduledAction,
} from "@/app/actions";

type RoutineRef = { id: string; name: string };
type Pending =
  | { mode: "add"; routineId: string; routineName: string }
  | { mode: "move"; routineId: string; routineName: string; fromDate: string };

const rowClass =
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
  logs: LogSummary[];
}) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sheet, setSheet] = useState<"add" | "pick" | "day" | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
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
    if (logByDate.has(key)) return void router.push(`/session/${key}`);
    if (scheduleByDate.has(key)) {
      setSheetDate(key);
      setSheet("day");
    }
  }

  const daySession = sheetDate ? scheduleByDate.get(sheetDate) : undefined;

  return (
    <div className="safe-top px-5 pb-3">
      <div className="flex items-start justify-between gap-3 pt-2">
        <h1 className="text-[27px] font-bold tracking-tight text-ink">Workout plan</h1>
        <button
          onClick={() => setSheet("add")}
          className="flex h-[38px] flex-none items-center gap-1.5 rounded-[13px] bg-ink px-[15px] active:opacity-85"
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
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(23,24,26,.08)] bg-surface text-base text-ink2"
        >
          ‹
        </button>
        <span className="text-base font-semibold text-ink">{grid.label}</span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(23,24,26,.08)] bg-surface text-base text-ink2"
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
          <button className={rowClass} onClick={() => setSheet("pick")}>
            <span className="text-[15px] font-semibold text-ink">Add workout to schedule</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
          <button className={rowClass} onClick={() => createRoutineAction()}>
            <span className="text-[15px] font-semibold text-ink">Create new routine</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
        </div>
      </Sheet>

      {/* Pick routine sheet */}
      <Sheet open={sheet === "pick"} onClose={() => setSheet(null)}>
        <div className="text-[21px] font-bold tracking-tight text-ink">
          Add workout to schedule
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {routines.length === 0 && (
            <div className="py-2 text-center text-[13px] text-faint">
              Create a routine first.
            </div>
          )}
          {routines.map((t) => (
            <button
              key={t.id}
              className={rowClass}
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

      {/* Day actions sheet */}
      <Sheet open={sheet === "day"} onClose={() => setSheet(null)}>
        <div className="text-[21px] font-bold tracking-tight text-ink">
          {daySession?.routineName}
        </div>
        <div className="mt-2 text-[13px] text-muted">
          {sheetDate && formatLong(sheetDate)}
          {daySession?.hasOverride ? " · edited" : ""}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            className={rowClass}
            onClick={() => {
              if (daySession && sheetDate) {
                setPending({
                  mode: "move",
                  routineId: daySession.routineId,
                  routineName: daySession.routineName,
                  fromDate: sheetDate,
                });
              }
              setSheet(null);
            }}
          >
            <span className="text-[15px] font-semibold text-ink">Move to another day</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
          <button
            className={rowClass}
            onClick={() => sheetDate && router.push(`/schedule/${sheetDate}/edit`)}
          >
            <span className="text-[15px] font-semibold text-ink">Edit this session only</span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
          <button
            className={rowClass}
            onClick={() => daySession && router.push(`/routines/${daySession.routineId}/edit`)}
          >
            <span className="text-[15px] font-semibold text-ink">
              Edit {daySession?.routineName} routine
            </span>
            <span className="text-[15px] text-[#C6C3BC]">›</span>
          </button>
          <button
            className="flex h-[54px] items-center justify-center rounded-[18px] border border-[rgba(190,60,50,.25)] bg-surface active:bg-[#FDF4F3]"
            onClick={async () => {
              if (sheetDate) await removeScheduledAction(sheetDate);
              setSheet(null);
              router.refresh();
            }}
          >
            <span className="text-[15px] font-semibold text-danger">
              Remove from schedule
            </span>
          </button>
        </div>
      </Sheet>

      {toast && (
        <div
          className="fixed inset-x-4 bottom-[98px] z-40 flex items-center gap-3 rounded-[17px] bg-ink px-[18px] py-[15px] shadow-[0_16px_34px_-14px_rgba(23,24,26,.5)]"
          style={{ animation: "toastIn .22s ease" }}
        >
          <div className="h-[7px] w-[7px] flex-none rounded-full bg-[#5FCB92]" />
          <span className="flex-1 text-sm font-medium text-white">{toast}</span>
        </div>
      )}
    </div>
  );
}
