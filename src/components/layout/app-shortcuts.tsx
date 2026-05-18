"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNotesStore } from "@/services/notes-store";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function AppShortcuts() {
  const router = useRouter();
  const activeFolderId = useNotesStore((state) => state.activeFolderId);
  const createNote = useNotesStore((state) => state.createNote);
  const syncNow = useNotesStore((state) => state.syncNow);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier || isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "n") {
        event.preventDefault();
        createNote(activeFolderId)
          .then((note) => router.push(`/note/${note.id}`))
          .catch(() => undefined);
      }

      if (key === "k" || key === "f") {
        event.preventDefault();
        router.push("/?focus=search");
      }

      if (key === ",") {
        event.preventDefault();
        router.push("/settings");
      }

      if (event.shiftKey && key === "h") {
        event.preventDefault();
        router.push("/habits");
      }

      if (event.shiftKey && key === "s") {
        event.preventDefault();
        void syncNow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFolderId, createNote, router, syncNow]);

  return null;
}
