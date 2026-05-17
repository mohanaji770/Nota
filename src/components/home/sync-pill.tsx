"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { useNotesStore } from "@/services/notes-store";

export function SyncPill() {
  const syncStatus = useNotesStore((state) => state.syncStatus);

  const statusContent = {
    idle: ["جاهز للمزامنة", Cloud],
    local: ["محلي فقط", CloudOff],
    syncing: ["جاري المزامنة", Loader2],
    synced: ["متزامن", Cloud],
    error: ["تعذرت المزامنة", CloudOff]
  } satisfies Record<typeof syncStatus, [string, typeof Cloud]>;

  const content = statusContent[syncStatus];

  const Icon = content[1];

  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={15} className={syncStatus === "syncing" ? "animate-spin" : ""} />
      {content[0]}
    </span>
  );
}
