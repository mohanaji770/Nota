"use client";

import { useLayoutEffect, type RefObject } from "react";

export function useAutoResize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.style.height = "0px";
    node.style.height = `${Math.max(node.scrollHeight, 48)}px`;
  }, [ref, value]);
}
