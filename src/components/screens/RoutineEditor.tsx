"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoutineExercise, Unit } from "@/db/schema";
import type { EditorExercise } from "@/lib/types";
import { convWeight, nextCode } from "@/lib/workout";
import { saveRoutineAction, saveSessionOverrideAction } from "@/app/actions";

type Row = {
  key: string;
  exerciseId?: string;
  code: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  unit: Unit;
};

let counter = 0;
const rowKey = () => `row-${counter++}`;

function toRows(list: RoutineExercise[]): Row[] {
  return list.map((e) => ({
    key: rowKey(),
    exerciseId: e.exerciseId,
    code: e.code,
    name: e.name,
    sets: String(e.sets),
    reps: String(e.reps),
    weight: e.weight === null ? "" : String(e.weight),
    unit: e.unit,
  }));
}

function clampInt(v: string, min: number, max: number, fallback: number): number {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function RoutineEditor({
  mode,
  routineId,
  date,
  editableName,
  initialName,
  titleText,
  initialExercises,
}: {
  mode: "routine" | "session";
  routineId?: string;
  date?: string;
  editableName: boolean;
  initialName: string;
  titleText?: string;
  initialExercises: RoutineExercise[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [rows, setRows] = useState<Row[]>(toRows(initialExercises));
  const [saving, setSaving] = useState(false);

  function patch(key: string, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...next } : r)));
  }

  function setUnit(key: string, unit: Unit) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key || r.unit === unit) return r;
        const w = r.weight.trim();
        const num = parseFloat(w);
        const weight = w === "" || Number.isNaN(num) ? r.weight : String(convWeight(num, r.unit, unit));
        return { ...r, unit, weight };
      }),
    );
  }

  function addExercise() {
    setRows((rs) => [
      ...rs,
      { key: rowKey(), code: nextCode(rs), name: "New exercise", sets: "3", reps: "10", weight: "", unit: "lb" },
    ]);
  }

  async function confirm() {
    setSaving(true);
    const exercises: EditorExercise[] = rows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name.trim() || "Untitled",
      code: r.code.trim().toUpperCase() || "A1",
      sets: clampInt(r.sets, 1, 9, 3),
      reps: clampInt(r.reps, 1, 99, 10),
      weight: r.weight.trim() === "" ? null : Number.isNaN(parseFloat(r.weight)) ? null : parseFloat(r.weight),
      unit: r.unit,
    }));
    if (mode === "routine" && routineId) {
      await saveRoutineAction({ id: routineId, name: name.trim() || "Untitled routine", exercises });
    } else if (mode === "session" && date) {
      await saveSessionOverrideAction({ date, exercises });
    }
  }

  const unitPill = (r: Row, u: Unit) => (
    <button
      onClick={() => setUnit(r.key, u)}
      className="rounded-md px-2 py-1"
      style={{ background: r.unit === u ? "#fff" : "transparent" }}
    >
      <span
        className="text-[10px] font-bold tracking-wider"
        style={{ color: r.unit === u ? "#17181A" : "#8E8B84" }}
      >
        {u.toUpperCase()}
      </span>
    </button>
  );

  return (
    <div className="safe-top min-h-dvh px-5 pb-3">
      <button
        onClick={() => router.push("/plan")}
        className="mb-4 mt-2 flex items-center gap-1.5"
      >
        <span className="text-[17px] text-accent">‹</span>
        <span className="text-sm font-semibold text-accent">Workout plan</span>
      </button>

      {editableName ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent text-[27px] font-bold tracking-tight text-ink outline-none"
        />
      ) : (
        <div className="text-[27px] font-bold tracking-tight text-ink">{titleText}</div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="rounded-[20px] bg-surface p-4 shadow-[0_1px_2px_rgba(23,24,26,.04)]"
          >
            <div className="flex items-center gap-2.5">
              <input
                value={r.code}
                onChange={(e) => patch(r.key, { code: e.target.value.toUpperCase().slice(0, 3) })}
                maxLength={3}
                className="w-[38px] flex-none rounded-lg bg-accent-soft py-[7px] text-center text-[11px] font-bold uppercase text-accent outline-none"
              />
              <input
                value={r.name}
                onChange={(e) => patch(r.key, { name: e.target.value, exerciseId: undefined })}
                className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none"
              />
              <button
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-page text-[15px] text-muted"
              >
                ×
              </button>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1fr_1.3fr] items-end gap-2">
              <div>
                <div className="mb-1.5 text-[10px] font-semibold tracking-widest text-faint">SETS</div>
                <input
                  value={r.sets}
                  onChange={(e) => patch(r.key, { sets: e.target.value })}
                  inputMode="numeric"
                  className="h-[42px] w-full rounded-[13px] bg-page text-center text-[15px] font-semibold text-ink outline-none"
                />
              </div>
              <div>
                <div className="mb-1.5 text-[10px] font-semibold tracking-widest text-faint">REPS</div>
                <input
                  value={r.reps}
                  onChange={(e) => patch(r.key, { reps: e.target.value })}
                  inputMode="numeric"
                  className="h-[42px] w-full rounded-[13px] bg-page text-center text-[15px] font-semibold text-ink outline-none"
                />
              </div>
              <div>
                <div className="mb-1.5 flex w-fit gap-0.5 rounded-[9px] bg-page p-0.5">
                  {unitPill(r, "lb")}
                  {unitPill(r, "kg")}
                </div>
                <input
                  value={r.weight}
                  onChange={(e) => patch(r.key, { weight: e.target.value })}
                  placeholder="body"
                  inputMode="decimal"
                  className="h-[42px] w-full rounded-[13px] bg-page text-center text-[15px] font-semibold text-ink outline-none placeholder:text-[#C6C3BC]"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addExercise}
          className="flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-dashed border-[rgba(23,24,26,.15)] active:bg-surface"
        >
          <span className="text-[15px] font-semibold text-muted">+ Add exercise</span>
        </button>

        <button
          onClick={confirm}
          disabled={saving}
          className="my-1.5 flex h-14 items-center justify-center rounded-full bg-ink text-[17px] font-semibold tracking-tight text-white active:opacity-85 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Confirm changes"}
        </button>
      </div>
    </div>
  );
}
