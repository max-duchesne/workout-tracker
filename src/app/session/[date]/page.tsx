import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getLogByDate } from "@/db/queries";
import { formatLong } from "@/lib/dates";
import { BackButton } from "@/components/BackButton";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const userId = await requireUserId();
  const log = await getLogByDate(userId, date);
  if (!log) notFound();

  const minutes =
    log.startedAt && log.completedAt
      ? Math.max(1, Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 60000))
      : null;

  return (
    <div className="safe-top min-h-dvh px-5 pb-6">
      <div className="pt-2">
        <BackButton label="Back" />
      </div>
      <h1 className="text-[27px] font-bold tracking-tight text-ink">{log.routineName}</h1>
      <div className="mt-2 text-[13px] font-medium text-muted">
        {formatLong(date)}
        {minutes ? ` · ${minutes} min` : ""}
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {log.exercises.map((e, i) => (
          <div key={i} className="rounded-[20px] bg-surface p-4 shadow-[0_1px_2px_rgba(23,24,26,.04)]">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="w-[17px] flex-none text-[10px] font-bold text-faint">{e.code}</span>
              <span className="flex-1 text-[15px] font-semibold text-ink">{e.name}</span>
            </div>
            <div className="flex flex-col gap-[7px]">
              {e.sets.map((s, si) => (
                <div key={si} className="flex items-center gap-2.5 pl-[26px]">
                  <span className="w-3 text-[11px] font-medium text-faint">{si + 1}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink2">
                    {s.weight === null ? "Bodyweight" : `${s.weight} ${s.unit}`} &nbsp;×&nbsp; {s.reps}
                  </span>
                  {s.rpe !== null && (
                    <span className="text-xs font-medium text-muted">RPE {s.rpe}</span>
                  )}
                </div>
              ))}
            </div>
            {e.notes && (
              <div className="mt-3 pl-[26px] text-[13px] italic leading-snug text-muted">{e.notes}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
