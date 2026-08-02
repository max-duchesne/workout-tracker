"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LogSummary, ScheduleEntry } from "@/db/queries";
import type { DayInfo } from "@/lib/calendar";
import { formatShort, monthGridFromOffset, parseKey } from "@/lib/dates";
import { abbrOf } from "@/lib/workout";
import { Calendar } from "@/components/Calendar";

export function HistoryScreen({
  today,
  schedule,
  logs,
}: {
  today: string;
  schedule: ScheduleEntry[];
  logs: LogSummary[];
}) {
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  const activity: Record<string, DayInfo> = {};
  for (const s of schedule)
    activity[s.date] = { kind: "plan", abbr: abbrOf(s.routineName), hasOverride: s.hasOverride };
  for (const l of logs) activity[l.date] = { kind: "log", abbr: abbrOf(l.routineName) };

  const grid = monthGridFromOffset(offset, today);
  const monthLogs = logs.filter((l) => {
    const p = parseKey(l.date);
    return p.m === grid.month0 && p.y === grid.year;
  });

  return (
    <div className="safe-top px-5 pb-2">
      <h1 className="pt-2 text-[27px] font-bold tracking-tight text-ink">Past workouts</h1>

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
          onDayTap={(key) => {
            if (activity[key]?.kind === "log") router.push(`/session/${key}`);
          }}
        />
      </div>

      <div className="mb-2.5 mt-6 text-[11px] font-semibold tracking-[0.12em] text-faint">
        PAST SESSIONS
      </div>
      <div className="flex flex-col gap-2 pb-2">
        {monthLogs.map((s) => (
          <button
            key={s.date}
            onClick={() => router.push(`/session/${s.date}`)}
            className="flex items-center gap-3 rounded-[18px] bg-surface px-[17px] py-[15px] text-left shadow-[0_1px_2px_rgba(23,24,26,.04)] active:bg-[#FAF9F7]"
          >
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-ink">{s.routineName}</div>
              <div className="mt-1.5 text-xs font-medium text-muted">
                {formatShort(s.date)} · {s.exerciseCount} exercise{s.exerciseCount === 1 ? "" : "s"}
              </div>
            </div>
            <span className="text-base text-[#C6C3BC]">›</span>
          </button>
        ))}
        {monthLogs.length === 0 && (
          <div className="py-2.5 text-center text-[13px] text-faint">
            No workouts logged in {grid.label}.
          </div>
        )}
      </div>
    </div>
  );
}
