import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { buildActiveWorkout } from "@/db/queries";
import { formatLong } from "@/lib/dates";
import { LiveWorkout } from "@/components/screens/LiveWorkout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const userId = await requireUserId();
  const active = await buildActiveWorkout(userId, date);
  if (!active) notFound();

  return <LiveWorkout active={active} dateLong={formatLong(date)} />;
}
