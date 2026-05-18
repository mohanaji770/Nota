"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/services/notes-store";
import { AppShortcuts } from "./app-shortcuts";
import { AppStatusToast } from "./app-status-toast";
import { HabitReminderRuntime } from "./habit-reminder-runtime";
import { PwaRegistrar } from "./pwa-registrar";
import { PwaUpdatePrompt } from "./pwa-update-prompt";
import { ThemeRuntime } from "./theme-runtime";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useNotesStore((state) => state.hydrate);
  const syncNow = useNotesStore((state) => state.syncNow);

  useEffect(() => {
    hydrate().then(syncNow).catch(() => undefined);
  }, [hydrate, syncNow]);

  return (
    <>
      <ThemeRuntime />
      <AppShortcuts />
      <HabitReminderRuntime />
      <PwaRegistrar />
      <PwaUpdatePrompt />
      <AppStatusToast />
      {children}
    </>
  );
}
