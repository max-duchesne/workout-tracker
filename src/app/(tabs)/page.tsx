import { requireUserId } from "@/lib/session";
import { getActivityMap, getNextWorkout } from "@/db/queries";
import { addDaysKey, formatLong, parseKey, todayKey, weeksFromToday } from "@/lib/dates";
import { HomeScreen } from "@/components/screens/HomeScreen";

export default async function HomePage() {
  const userId = await requireUserId();
  const today = todayKey();
  const next = await getNextWorkout(userId, today);
  const weeks = weeksFromToday(3, today);
  const activity = await getActivityMap(
    userId,
    weeks[0],
    addDaysKey(weeks[weeks.length - 1], 1),
  );
  const weekCells = weeks.map((k) => ({ key: k, day: parseKey(k).d }));

  return (
    <HomeScreen
      today={today}
      todayLong={formatLong(today)}
      next={next}
      weekCells={weekCells}
      activity={activity}
    />
  );
}
