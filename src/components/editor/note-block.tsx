"use client";

import { Check, Minus } from "lucide-react";
import { useRef } from "react";
import { useAutoResize } from "@/hooks/use-auto-resize";
import { cn } from "@/lib/cn";
import { normalizeBlockFromText } from "@/lib/notes";
import type { NoteBlock } from "@/types/notes";

type EditorBlockProps = {
  block: NoteBlock;
  onChange: (blockId: string, patch: Partial<NoteBlock>) => void;
  onEnter: (blockId: string, type?: NoteBlock["type"]) => void;
  onRemove: (blockId: string) => void;
};

export function EditorBlock({ block, onChange, onEnter, onRemove }: EditorBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResize(textareaRef, block.text);

  const handleChange = (value: string) => {
    const normalized = normalizeBlockFromText({ ...block, text: value });
    onChange(block.id, {
      type: normalized.type,
      text: normalized.text,
      checked: normalized.checked
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEnter(block.id, block.type === "check" ? "check" : "paragraph");
    }

    if (event.key === "Backspace" && block.text.length === 0) {
      event.preventDefault();
      onRemove(block.id);
    }
  };

  return (
    <div className="group flex min-h-8 items-start gap-2 rounded-[14px] px-0.5 py-0 transition duration-150">
      {block.type === "check" ? (
        <button
          type="button"
          aria-label={block.checked ? "مهمة مكتملة" : "مهمة غير مكتملة"}
          onClick={() => onChange(block.id, { checked: !block.checked })}
          className={cn(
            "focus-ring mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition active:scale-95",
            block.checked
              ? "border-white/0 bg-[#2f8f56] text-white"
              : "border-white/16 bg-white/[0.035] text-transparent"
          )}
        >
          <Check size={12} />
        </button>
      ) : block.type === "list" ? (
        <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center text-white/30">
          <Minus size={14} />
        </span>
      ) : null}

      <textarea
        ref={textareaRef}
        data-block-input={block.id}
        value={block.text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={block.type === "heading" ? "عنوان" : block.type === "check" ? "مهمة" : "اكتب هنا"}
        className={cn(
          "min-h-8 flex-1 overflow-hidden bg-transparent py-1 text-right outline-none placeholder:text-white/24",
          block.type === "heading"
            ? "text-[calc(1.08rem*var(--note-font-scale))] font-semibold leading-7 text-white/92"
            : "text-[calc(0.94rem*var(--note-font-scale))] font-normal leading-6 text-white/78",
          block.checked && "text-white/34 line-through"
        )}
      />
    </div>
  );
}
