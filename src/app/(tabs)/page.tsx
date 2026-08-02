import { requireUserId } from "@/lib/session";
import { getNextWorkout, getSchedule, getWorkoutLogsInRange } from "@/db/queries";
import { addDaysKey, formatLong, todayKey } from "@/lib/dates";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default async function HomePage() {
  const userId = await requireUserId();
  const today = todayKey();
  const from = addDaysKey(today, -150);
  const to = addDaysKey(today, 320);
  const [next, schedule, logs] = await Promise.all([
    getNextWorkout(userId, today),
    getSchedule(userId, from, to),
    getWorkoutLogsInRange(userId, from, to),
  ]);

  return (
    <HomeScreen
      today={today}
      todayLong={formatLong(today)}
      next={next}
      schedule={schedule}
      logs={logs}
    />
  );
}
