"use client";

import { useRouter } from "next/navigation";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5">
      <span className="text-[17px] text-accent">‹</span>
      <span className="text-sm font-semibold text-accent">{label}</span>
    </button>
  );
}
