"use client";

import { useRouter } from "next/navigation";
import { formatLong } from "@/lib/dates";
import { Sheet } from "@/components/Sheet";
import { removeScheduledAction } from "@/app/actions";

export type DaySession = {
  date: string;
  routineId: string;
  routineName: string;
  hasOverride: boolean;
};

const row =
  "flex h-[54px] items-center justify-between rounded-[18px] bg-page px-[18px] active:bg-[#EAE8E4]";

export function DaySheet({
  session,
  onClose,
  onMoveStart,
}: {
  session: DaySession | null;
  onClose: () => void;
  onMoveStart: (session: DaySession) => void;
}) {
  const router = useRouter();
  return (
    <Sheet open={!!session} onClose={onClose}>
      {session && (
        <>
          <div className="text-[21px] font-bold tracking-tight text-ink">
            {session.routineName}
          </div>
          <div className="mt-2 text-[13px] text-muted">
            {formatLong(session.date)}
            {session.hasOverride ? " · edited" : ""}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <button className={row} onClick={() => onMoveStart(session)}>
              <span className="text-[15px] font-semibold text-ink">Move to another day</span>
              <span className="text-[15px] text-[#C6C3BC]">›</span>
            </button>
            <button
              className={row}
              onClick={() => router.push(`/schedule/${session.date}/edit`)}
            >
              <span className="text-[15px] font-semibold text-ink">Edit this session only</span>
              <span className="text-[15px] text-[#C6C3BC]">›</span>
            </button>
            <button
              className={row}
              onClick={() => router.push(`/routines/${session.routineId}/edit`)}
            >
              <span className="text-[15px] font-semibold text-ink">
                Edit {session.routineName} routine
              </span>
              <span className="text-[15px] text-[#C6C3BC]">›</span>
            </button>
            <button
              className="flex h-[54px] items-center justify-center rounded-full border border-[rgba(190,60,50,.25)] bg-surface active:bg-[#FDF4F3]"
              onClick={async () => {
                await removeScheduledAction(session.date);
                onClose();
                router.refresh();
              }}
            >
              <span className="text-[15px] font-semibold text-danger">Remove from schedule</span>
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
