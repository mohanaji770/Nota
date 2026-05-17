"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/services/notes-store";

export function ThemeRuntime() {
  const theme = useNotesStore((state) => state.theme);

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

  return null;
}
