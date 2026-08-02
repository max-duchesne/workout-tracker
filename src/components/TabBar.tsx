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
  const activeIdx = TABS.findIndex(([href]) =>
    href === "/" ? path === "/" : path.startsWith(href),
  );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pt-3.5"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 22px)",
        background:
          "linear-gradient(to top, rgba(244,243,241,.92) 42%, rgba(244,243,241,0))",
      }}
    >
      <div
        className="pointer-events-auto flex w-full items-center gap-0.5 rounded-full p-[5px]"
        style={{
          background: "rgba(255,255,255,.72)",
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          boxShadow:
            "0 0 0 .5px rgba(23,24,26,.08), 0 8px 24px -8px rgba(23,24,26,.22), 0 2px 6px -2px rgba(23,24,26,.1)",
        }}
      >
        {TABS.map(([href, label], i) => {
          const on = i === activeIdx;
          const prevOn = i - 1 === activeIdx;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex h-11 flex-1 items-center justify-center rounded-full transition-colors"
              style={{
                background: on ? "#fff" : "transparent",
                boxShadow: on
                  ? "0 0 0 .5px rgba(23,24,26,.06), 0 2px 6px -1px rgba(23,24,26,.16)"
                  : "none",
              }}
            >
              <div
                className="absolute bottom-3 left-0 top-3 w-px"
                style={{
                  background: i > 0 && !on && !prevOn ? "rgba(23,24,26,.12)" : "transparent",
                }}
              />
              <span
                className="text-[15px] font-semibold tracking-tight"
                style={{ color: on ? "#17181A" : "#5F5C56" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
