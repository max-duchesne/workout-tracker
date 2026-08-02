"use client";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
        style={{ animation: "fadeIn .18s ease" }}
      />
      <div
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-surface px-5 pb-6 pt-6 shadow-[0_-20px_50px_-20px_rgba(23,24,26,.3)]"
        style={{ animation: "sheetIn .28s cubic-bezier(.32,.72,0,1)" }}
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-[#E4E2DD]" />
        {children}
      </div>
    </>
  );
}
