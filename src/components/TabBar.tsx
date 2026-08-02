"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/", "Home"],
  ["/history", "History"],
  ["/plan", "Plan"],
] as const;

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="safe-bottom flex flex-none items-start gap-1 border-t border-line bg-white/90 px-3 pt-2 backdrop-blur-xl">
      {TABS.map(([href, label]) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex h-14 flex-1 flex-col items-center justify-center gap-1.5"
          >
            <span
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: active ? "#2F7D57" : "transparent" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: active ? "#17181A" : "#7C7972" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
