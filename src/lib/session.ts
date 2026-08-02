import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Data-access guard. Secure auth checks live here (and in every server action),
 * close to the data — the proxy only does an optimistic redirect. Memoized per
 * render pass so multiple callers in one request share a single check.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/** Returns the signed-in user's id, or redirects to /login. */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");
  return user.id;
}
