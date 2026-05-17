"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/services/notes-store";

export function ThemeRuntime() {
  const theme = useNotesStore((state) => state.theme);
  const settings = useNotesStore((state) => state.settings);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", shouldUseDark);
      root.style.colorScheme = shouldUseDark ? "dark" : "light";
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const fontFamily =
      settings.fontFamily === "amiri"
        ? '"Amiri Quran", "Cairo", Tahoma, Arial, sans-serif'
        : '"Cairo", Tahoma, Arial, sans-serif';

    root.style.setProperty("--app-font-family", fontFamily);
    root.style.setProperty("--note-font-scale", String(settings.noteFontScale));
  }, [settings.fontFamily, settings.noteFontScale]);

  return null;
}
