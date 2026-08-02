// Pure visual mapping for a calendar day cell, mirroring the design.

export type DayKind = "log" | "plan" | null;

export type DayInfo = {
  kind: DayKind;
  abbr: string;
  hasOverride?: boolean;
};

export type DayColors = {
  bg: string;
  fg: string;
  tag: string;
  tagColor: string;
  dot: string;
  ring: string;
};

export function dayColors(
  info: DayInfo | undefined,
  isToday: boolean,
  picking: boolean,
): DayColors {
  const done = info?.kind === "log";
  const sched = info?.kind === "plan";
  return {
    bg: done
      ? "rgba(47,125,87,.15)"
      : sched
        ? "#F2ECE3"
        : picking
          ? "#FBFAF9"
          : "transparent",
    fg: done ? "#2A6B4A" : "#3D3B37",
    tag: info?.abbr ?? "",
    tagColor: done ? "rgba(47,125,87,.75)" : "#8A6A3B",
    dot: isToday ? "#17181A" : "transparent",
    ring:
      picking && !sched && !done ? "inset 0 0 0 1px rgba(47,125,87,.35)" : "none",
  };
}
