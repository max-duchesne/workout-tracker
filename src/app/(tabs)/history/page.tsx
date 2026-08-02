import { requireUserId } from "@/lib/session";
import { getLogs, getSchedule } from "@/db/queries";
import { addDaysKey, todayKey } from "@/lib/dates";
import { HistoryScreen } from "@/components/screens/HistoryScreen";

export default async function HistoryPage() {
  const userId = await requireUserId();
  const today = todayKey();
  const from = addDaysKey(today, -400);
  const to = addDaysKey(today, 40);
  const [schedule, logs] = await Promise.all([
    getSchedule(userId, from, to),
    getLogs(userId, from, to),
  ]);

  return <HistoryScreen today={today} schedule={schedule} logs={logs} />;
}
