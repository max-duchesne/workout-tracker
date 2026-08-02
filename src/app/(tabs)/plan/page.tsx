import { requireUserId } from "@/lib/session";
import { getLogs, getSchedule, listRoutines } from "@/db/queries";
import { addDaysKey, todayKey } from "@/lib/dates";
import { PlanScreen } from "@/components/screens/PlanScreen";

export default async function PlanPage() {
  const userId = await requireUserId();
  const today = todayKey();
  const from = addDaysKey(today, -150);
  const to = addDaysKey(today, 320);
  const [routines, schedule, logs] = await Promise.all([
    listRoutines(userId),
    getSchedule(userId, from, to),
    getLogs(userId, from, to),
  ]);

  return (
    <PlanScreen
      today={today}
      routines={routines.map((r) => ({ id: r.id, name: r.name }))}
      schedule={schedule}
      logs={logs}
    />
  );
}
