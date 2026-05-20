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
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", shouldUseDark ? "#111110" : "#fafaf6");
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
    root.style.setProperty("--note-line-height-scale", String(settings.noteLineHeightScale));
  }, [settings.fontFamily, settings.noteFontScale, settings.noteLineHeightScale]);

  return null;
}
