"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/services/notes-store";
import { PwaRegistrar } from "./pwa-registrar";
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
      <PwaRegistrar />
      {children}
    </>
  );
}
