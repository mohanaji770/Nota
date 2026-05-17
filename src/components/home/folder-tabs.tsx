"use client";

import { cn } from "@/lib/cn";
import { useNotesStore } from "@/services/notes-store";

export function FolderTabs() {
  const folders = useNotesStore((state) => state.folders);
  const activeFolderId = useNotesStore((state) => state.activeFolderId);
  const setFolder = useNotesStore((state) => state.setFolder);

  return (
    <nav className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="التصنيفات">
      {folders.map((folder) => {
        const active = folder.id === activeFolderId;
        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => setFolder(folder.id)}
            className={cn(
              "focus-ring min-h-12 shrink-0 rounded-full border px-4 text-sm font-medium transition duration-200 ease-material active:scale-[0.98]",
              active
                ? "border-transparent bg-leaf-600 text-white shadow-sm"
                : "border-black/[0.08] bg-white/70 text-ink-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-ink-50"
            )}
          >
            <span
              className="ml-2 inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: active ? "#fff" : folder.color }}
              aria-hidden
            />
            {folder.name}
          </button>
        );
      })}
    </nav>
  );
}
