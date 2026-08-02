// Date helpers. Dates are handled as local calendar keys ("YYYY-MM-DD") to match
// how the app reasons about days (no time-of-day, no timezone math on the data).

export const DOW1 = ["S", "M", "T", "W", "T", "F", "S"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Build a key from a year, 0-indexed month, and day. */
export function dateKey(y: number, month0: number, d: number): string {
  return `${y}-${pad(month0 + 1)}-${pad(d)}`;
}

/** Today's calendar key in local time. */
export function todayKey(now: Date = new Date()): string {
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseKey(k: string): { y: number; m: number; d: number } {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function keyToDate(k: string): Date {
  const { y, m, d } = parseKey(k);
  return new Date(y, m, d);
}

export function addDaysKey(k: string, days: number): string {
  const dt = keyToDate(k);
  dt.setDate(dt.getDate() + days);
  return todayKey(dt);
}

/** Whole days from `bKey` to `aKey` (a - b). */
export function diffDays(aKey: string, bKey: string): number {
  return Math.round(
    (keyToDate(aKey).getTime() - keyToDate(bKey).getTime()) / 86_400_000,
  );
}

/** "Mon, Aug 1" */
export function formatShort(k: string): string {
  const dt = keyToDate(k);
  return `${DAYS[dt.getDay()].slice(0, 3)}, ${MON[dt.getMonth()]} ${dt.getDate()}`;
}

/** "Monday, August 1" */
export function formatLong(k: string): string {
  const dt = keyToDate(k);
  return `${DAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

export type MonthGridCell = { key: string; day: number } | null;

/** A 7-column month matrix (leading/trailing blanks as null) for calendars. */
export function monthGrid(year: number, month0: number): {
  cells: MonthGridCell[];
  label: string;
  year: number;
  month0: number;
} {
  const first = new Date(year, month0, 1).getDay();
  const len = new Date(year, month0 + 1, 0).getDate();
  const cells: MonthGridCell[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= len; d++) cells.push({ key: dateKey(year, month0, d), day: d });
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells, label: `${MONTHS[month0]} ${year}`, year, month0 };
}

/** Month offset from today (e.g. -1 = last month), wrapped correctly. */
export function monthGridFromOffset(offset: number, today: string = todayKey()) {
  const t = parseKey(today);
  let m = t.m + offset;
  let y = t.y;
  while (m < 0) { m += 12; y--; }
  while (m > 11) { m -= 12; y++; }
  return monthGrid(y, m);
}

/** `n` weeks of day keys starting from the Sunday of today's week. */
export function weeksFromToday(n: number, today: string = todayKey()): string[] {
  const t = keyToDate(today);
  const start = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay());
  return Array.from({ length: n * 7 }, (_, i) => {
    const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
  });
}
