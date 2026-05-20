"use client";

import { X } from "lucide-react";
import { useNotesStore } from "@/services/notes-store";

export function AppStatusToast() {
  const operationError = useNotesStore((state) => state.operationError);
  const syncStatus = useNotesStore((state) => state.syncStatus);
  const syncError = useNotesStore((state) => state.syncError);
  const clearOperationError = useNotesStore((state) => state.clearOperationError);

  const message = operationError || (syncStatus === "error" ? syncError : null);
  if (!message) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(18px+var(--safe-bottom))] z-[70] mx-auto flex max-w-[380px] items-center gap-3 rounded-2xl bg-[#1c1c1e] px-4 py-3 text-right text-[0.78rem] font-semibold leading-5 text-white shadow-2xl ring-1 ring-white/[0.08] dark:bg-[#2c2c2e]">
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={clearOperationError}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/65 transition active:scale-95"
        aria-label="إغلاق"
      >
        <X size={15} />
      </button>
    </div>
  );
}
