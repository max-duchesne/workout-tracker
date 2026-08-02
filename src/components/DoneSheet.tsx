"use client";

import type { WorkoutLog } from "@/db/schema";
import { formatLong } from "@/lib/dates";

export function DoneSheet({
  log,
  onClose,
}: {
  log: WorkoutLog | null;
  onClose: () => void;
}) {
  if (!log) return null;
  const minutes =
    log.startedAt && log.completedAt
      ? Math.max(
          1,
          Math.round(
            (new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 60000,
          ),
        )
      : null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[45] bg-black/30"
        style={{ animation: "fadeIn .18s ease" }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82%] flex-col rounded-t-[28px] bg-surface shadow-[0_-20px_50px_-20px_rgba(23,24,26,.3)]"
        style={{ animation: "sheetIn .28s cubic-bezier(.32,.72,0,1)" }}
      >
        <div className="flex-none border-b border-line px-5 pb-3.5 pt-3.5">
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[#E4E2DD]" />
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-accent-soft px-[9px] py-1.5 text-[10px] font-bold tracking-wider text-[#2A6B4A]">
              COMPLETED
            </span>
            <span className="flex-1" />
            <button
              onClick={onClose}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-page text-[15px] text-muted"
            >
              ×
            </button>
          </div>
          <div className="mt-3 text-[21px] font-bold tracking-tight text-ink">
            {log.routineName}
          </div>
          <div className="mt-2 text-[13px] text-muted">
            {formatLong(log.date)}
            {minutes ? ` · ${minutes} min` : ""}
          </div>
        </div>

        <div className="safe-bottom flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-8 pt-4">
          {log.exercises.map((e, i) => (
            <div key={i} className="rounded-[20px] bg-[#FAF9F7] p-4">
              <div className="mb-3 flex items-baseline gap-2.5">
                <span className="w-[17px] flex-none text-[10px] font-bold text-faint">
                  {e.code}
                </span>
                <span className="flex-1 text-[15px] font-semibold text-ink">{e.name}</span>
              </div>
              <div className="flex flex-col gap-[7px]">
                {e.sets.map((s, si) => (
                  <div key={si} className="flex items-center gap-2.5 pl-[26px]">
                    <span className="w-3 text-[11px] font-medium text-faint">{si + 1}</span>
                    <span className="text-sm font-semibold tabular-nums text-ink2">
                      {s.weight === null ? "Bodyweight" : `${s.weight} ${s.unit}`} &nbsp;×&nbsp;{" "}
                      {s.reps}
                    </span>
                    {s.rpe !== null && (
                      <span className="text-xs font-medium text-muted">RPE {s.rpe}</span>
                    )}
                  </div>
                ))}
              </div>
              {e.notes && (
                <div className="mt-3 pl-[26px] text-[13px] italic leading-snug text-muted">
                  {e.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
