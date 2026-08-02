import { TabBar } from "@/components/TabBar";

// These screens are per-user and read the session cookie — never prerender them.
export const dynamic = "force-dynamic";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The tab bar floats over the content (fixed); each screen pads its bottom.
  return (
    <div className="min-h-dvh">
      {children}
      <TabBar />
    </div>
  );
}
