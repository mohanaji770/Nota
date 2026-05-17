"use client";

import { useCallback, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}
