"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActiveWorkout } from "@/db/queries";
import type { Unit } from "@/db/schema";
import type { LiveSetInput } from "@/lib/types";
import { MON, parseKey } from "@/lib/dates";
import { convWeight, nextCode } from "@/lib/workout";
import { Sheet } from "@/components/Sheet";
import { submitWorkoutAction } from "@/app/actions";

type Ex = {
  exerciseId?: string;
  code: string;
  name: string;
  unit: Unit;
  plan: { sets: number; reps: number; weight: number | null; unit: Unit };
  last: { date: string; sets: { weight: number | null; unit: Unit; reps: number }[] } | null;
  notes: string;
  sets: LiveSetInput[];
};

const blankSet = (): LiveSetInput => ({ w: "", r: "", rpe: "" });

function initExercises(active: ActiveWorkout): Ex[] {
  return active.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    code: e.code,
    name: e.name,
    unit: e.unit,
    plan: e.plan,
    last: e.last,
    notes: "",
    sets: Array.from({ length: Math.max(1, e.plan.sets) }, blankSet),
  }));
}

export function LiveWorkout({
  active,
  dateLong,
}: {
  active: ActiveWorkout;
  dateLong: string;
}) {
  const router = useRouter();
  const startedAt = useRef(new Date().toISOString());
  const [exs, setExs] = useState<Ex[]>(() => initExercises(active));
  const [open, setOpen] = useState<number | null>(null);
  const [sheet, setSheet] = useState<"finish" | "discard" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const counts = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const e of exs)
      for (const s of e.sets) {
        total++;
        if (s.w !== "" || s.r !== "") done++;
      }
    return { done, total, blank: total - done };
  }, [exs]);
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

  function patchEx(i: number, next: Partial<Ex>) {
    setExs((es) => es.map((e, idx) => (idx === i ? { ...e, ...next } : e)));
  }
  function patchSet(i: number, si: number, next: Partial<LiveSetInput>) {
    setExs((es) =>
      es.map((e, idx) =>
        idx === i ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...next } : s)) } : e,
      ),
    );
  }
  function setUnit(i: number, unit: Unit) {
    setExs((es) =>
      es.map((e, idx) => {
        if (idx !== i || e.unit === unit) return e;
        const sets = e.sets.map((s) => {
          if (s.w === "") return s;
          const n = parseFloat(s.w);
          return Number.isNaN(n) ? s : { ...s, w: String(convWeight(n, e.unit, unit)) };
        });
        return { ...e, unit, sets };
      }),
    );
  }
  function addSet(i: number) {
    setExs((es) => es.map((e, idx) => (idx === i ? { ...e, sets: [...e.sets, blankSet()] } : e)));
  }
  function addExercise() {
    setExs((es) => [
      ...es,
      {
        code: nextCode(es),
        name: "New exercise",
        unit: "lb",
        plan: { sets: 3, reps: 10, weight: null, unit: "lb" },
        last: null,
        notes: "",
        sets: [blankSet(), blankSet(), blankSet()],
      },
    ]);
    setOpen(exs.length);
  }

  async function submit() {
    setSubmitting(true);
    await submitWorkoutAction({
      date: active.date,
      routineId: active.routineId,
      routineName: active.routineName,
      startedAt: startedAt.current,
      exercises: exs.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        code: e.code,
        notes: e.notes,
        unit: e.unit,
        sets: e.sets,
      })),
    });
  }

  const finishBody =
    `${counts.done} of ${counts.total} sets logged` +
    (counts.blank
      ? ` · ${counts.blank} blank set${counts.blank === 1 ? "" : "s"} won't be saved.`
      : ".");

  return (
    <div className="flex min-h-dvh flex-col">
      {/* header */}
      <div className="safe-top flex-none border-b border-line bg-page/90 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSheet("discard")}
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl border border-[rgba(23,24,26,.08)] bg-surface text-base text-ink2"
          >
            ×
          </button>
          <div className="flex-1 text-center">
            <div className="text-base font-semibold text-ink">{active.routineName}</div>
            <div className="mt-1 text-[11px] font-medium text-muted">{dateLong}</div>
          </div>
          <div className="w-[34px] flex-none" />
        </div>
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-[#E4E2DD]">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 pt-3.5">
        <div className="flex flex-col gap-2.5">
          {exs.map((e, i) => {
            const done = e.sets.filter((s) => s.w !== "" || s.r !== "").length;
            const full = done === e.sets.length;
            const planW = e.plan.weight === null ? null : convWeight(e.plan.weight, e.plan.unit, e.unit);
            let lastLine = "First time logging this exercise";
            if (e.last) {
              const ld = parseKey(e.last.date);
              lastLine =
                `Last · ${MON[ld.m]} ${ld.d} · ` +
                e.last.sets
                  .map((s) => (s.weight === null ? "BW" : convWeight(s.weight, s.unit, e.unit)) + "×" + s.reps)
                  .join(", ");
            }
            const scheme = `${e.plan.sets} × ${e.plan.reps} · ${planW === null ? "bodyweight" : planW + " " + e.unit}`;

            return (
              <div key={i} className="overflow-hidden rounded-[20px] bg-surface shadow-[0_1px_2px_rgba(23,24,26,.04)]">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex-none rounded-md bg-accent-soft px-1.5 py-[5px] text-[10px] font-bold text-accent">
                    {e.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-ink">{e.name}</div>
                    <div className="mt-1 text-xs font-medium tabular-nums text-muted">{scheme}</div>
                  </div>
                  <span
                    className="flex-none rounded-lg px-2 py-1.5 text-[11px] font-semibold tabular-nums"
                    style={{
                      color: full ? "#fff" : "#7C7972",
                      background: full ? "#2F7D57" : "#F4F3F1",
                    }}
                  >
                    {done}/{e.sets.length}
                  </span>
                </button>

                {open === i && (
                  <div className="px-4 pb-4 pt-0.5">
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        value={e.code}
                        onChange={(ev) => patchEx(i, { code: ev.target.value.toUpperCase().slice(0, 3) })}
                        maxLength={3}
                        className="w-[38px] flex-none rounded-[9px] bg-page py-[9px] text-center text-[11px] font-bold uppercase text-ink2 outline-none"
                      />
                      <input
                        value={e.name}
                        onChange={(ev) => patchEx(i, { name: ev.target.value, exerciseId: undefined })}
                        className="h-[34px] min-w-0 flex-1 rounded-xl bg-page px-3 text-sm font-medium text-ink2 outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2.5 px-0.5 pb-3">
                      <span className="flex-1 text-[11px] font-medium leading-snug text-faint">{lastLine}</span>
                      <div className="flex flex-none gap-0.5 rounded-[9px] bg-page p-0.5">
                        {(["lb", "kg"] as Unit[]).map((u) => (
                          <button
                            key={u}
                            onClick={() => setUnit(i, u)}
                            className="rounded-md px-[9px] py-1.5"
                            style={{ background: e.unit === u ? "#fff" : "transparent" }}
                          >
                            <span
                              className="text-[10px] font-bold tracking-wider"
                              style={{ color: e.unit === u ? "#17181A" : "#8E8B84" }}
                            >
                              {u.toUpperCase()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-2 grid grid-cols-[16px_1fr_1fr_62px] items-center gap-2">
                      <span />
                      <span className="text-center text-[10px] font-semibold tracking-widest text-faint">
                        {e.unit.toUpperCase()}
                      </span>
                      <span className="text-center text-[10px] font-semibold tracking-widest text-faint">REPS</span>
                      <span className="text-center text-[10px] font-semibold tracking-widest text-faint">RPE</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {e.sets.map((s, si) => {
                        const filled = s.w !== "" || s.r !== "";
                        const cell =
                          "h-[46px] w-full rounded-[14px] text-center text-base font-semibold text-ink outline-none";
                        const bg = filled ? "#F1F7F3" : "#FAF9F7";
                        const border = filled ? "1px solid rgba(47,125,87,.35)" : "1px solid rgba(23,24,26,.06)";
                        return (
                          <div key={si} className="grid grid-cols-[16px_1fr_1fr_62px] items-center gap-2">
                            <span className="text-center text-[11px] font-semibold text-faint">{si + 1}</span>
                            <input
                              value={s.w}
                              onChange={(ev) => patchSet(i, si, { w: ev.target.value })}
                              placeholder={planW === null ? "body" : String(planW)}
                              inputMode="decimal"
                              className={cell}
                              style={{ background: bg, border }}
                            />
                            <input
                              value={s.r}
                              onChange={(ev) => patchSet(i, si, { r: ev.target.value })}
                              placeholder={String(e.plan.reps)}
                              inputMode="numeric"
                              className={cell}
                              style={{ background: bg, border }}
                            />
                            <input
                              value={s.rpe}
                              onChange={(ev) => patchSet(i, si, { rpe: ev.target.value })}
                              placeholder="–"
                              inputMode="decimal"
                              className={cell}
                              style={{ background: bg, border, fontSize: 15 }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => addSet(i)}
                        className="flex h-10 flex-none items-center rounded-[13px] border-[1.5px] border-dashed border-[rgba(23,24,26,.14)] px-3.5 active:bg-[#FAF9F7]"
                      >
                        <span className="text-[13px] font-semibold text-muted">+ Set</span>
                      </button>
                      <input
                        value={e.notes}
                        onChange={(ev) => patchEx(i, { notes: ev.target.value })}
                        placeholder="Notes"
                        className="h-10 min-w-0 flex-1 rounded-[13px] bg-[#FAF9F7] px-3.5 text-sm text-ink2 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={addExercise}
            className="mb-1 flex h-[50px] items-center justify-center rounded-[18px] border-[1.5px] border-dashed border-[rgba(23,24,26,.15)] active:bg-surface"
          >
            <span className="text-sm font-semibold text-muted">+ Add exercise to this workout</span>
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="safe-bottom flex-none border-t border-line bg-page/95 px-4 pt-3 backdrop-blur">
        <button
          onClick={() => setSheet("finish")}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[19px] bg-ink text-[17px] font-semibold tracking-tight text-white active:opacity-85"
        >
          Finish workout
          <span className="text-[13px] font-medium tabular-nums text-white/55">
            {counts.done}/{counts.total}
          </span>
        </button>
      </div>

      <Sheet open={sheet === "finish"} onClose={() => setSheet(null)}>
        <div className="text-center text-[21px] font-bold tracking-tight text-ink">Finish this workout?</div>
        <div className="mt-2 text-center text-sm font-medium text-muted">{finishBody}</div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex h-14 items-center justify-center rounded-[19px] bg-accent text-[17px] font-semibold text-white active:opacity-85 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Submit workout"}
          </button>
          <button
            onClick={() => setSheet(null)}
            className="flex h-[52px] items-center justify-center rounded-[18px] bg-page text-base font-semibold text-ink2"
          >
            Keep logging
          </button>
        </div>
      </Sheet>

      <Sheet open={sheet === "discard"} onClose={() => setSheet(null)}>
        <div className="text-center text-[21px] font-bold tracking-tight text-ink">Discard this workout?</div>
        <div className="mt-2 text-center text-sm font-medium text-muted">Nothing you logged will be saved.</div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => router.push("/")}
            className="flex h-14 items-center justify-center rounded-[19px] border border-[rgba(190,60,50,.3)] bg-surface text-[17px] font-semibold text-danger active:bg-[#FDF4F3]"
          >
            Discard
          </button>
          <button
            onClick={() => setSheet(null)}
            className="flex h-[52px] items-center justify-center rounded-[18px] bg-page text-base font-semibold text-ink2"
          >
            Keep going
          </button>
        </div>
      </Sheet>
    </div>
  );
}
