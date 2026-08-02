import { TabBar } from "@/components/TabBar";

// These screens are per-user and read the session cookie — never prerender them.
export const dynamic = "force-dynamic";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <TabBar />
    </div>
  );
}
