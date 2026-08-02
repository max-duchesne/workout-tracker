"use client";

import { dayColors, type DayInfo } from "@/lib/calendar";
import { DOW1, type MonthGridCell } from "@/lib/dates";

export function Calendar({
  cells,
  activity,
  today,
  picking = false,
  onDayTap,
  cellHeight = 46,
}: {
  cells: MonthGridCell[];
  activity: Record<string, DayInfo>;
  today: string;
  picking?: boolean;
  onDayTap?: (key: string) => void;
  cellHeight?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {DOW1.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-semibold text-faint"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{ height: cellHeight }} />;
          const info = activity[c.key];
          const col = dayColors(info, c.key === today, picking);
          const tappable = !!onDayTap && (picking || !!info);
          return (
            <div
              key={i}
              onClick={tappable ? () => onDayTap!(c.key) : undefined}
              className="flex flex-col items-center justify-center gap-0.5 rounded-[13px]"
              style={{
                height: cellHeight,
                background: col.bg,
                boxShadow: col.ring,
                cursor: tappable ? "pointer" : "default",
              }}
            >
              <span
                className="text-[13px] font-semibold tabular-nums"
                style={{ color: col.fg }}
              >
                {c.day}
              </span>
              <span
                className="text-[9px] font-bold tracking-wide"
                style={{ color: col.tagColor }}
              >
                {col.tag}
              </span>
              <div
                className="h-1 w-1 rounded-full"
                style={{ background: col.dot }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
