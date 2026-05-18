"use client";

import { Check, Minus } from "lucide-react";
import { useRef } from "react";
import { useAutoResize } from "@/hooks/use-auto-resize";
import { cn } from "@/lib/cn";
import { normalizeBlockFromText, parseMarkdownToBlocks } from "@/lib/notes";
import type { NoteBlock } from "@/types/notes";

type EditorBlockProps = {
  block: NoteBlock;
  onChange: (blockId: string, patch: Partial<NoteBlock>) => void;
  onEnter: (blockId: string, type?: NoteBlock["type"]) => void;
  onRemove: (blockId: string) => void;
  onPasteBlocks?: (blockId: string, blocks: NoteBlock[]) => void;
  onSelectAll?: () => void;
  isSelectAll?: boolean;
};

export function EditorBlock({ block, onChange, onEnter, onRemove, onPasteBlocks, onSelectAll, isSelectAll }: EditorBlockProps) {
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

  const moveFocus = (direction: "up" | "down") => {
    const inputs = Array.from(document.querySelectorAll<HTMLTextAreaElement>("[data-block-input]"));
    const currentIndex = inputs.findIndex((input) => input === textareaRef.current);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const nextInput = inputs[nextIndex];
    if (nextInput) {
      nextInput.focus();
      const len = nextInput.value.length;
      nextInput.setSelectionRange(len, len);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const isAtStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const isAtEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;

    if ((event.ctrlKey || event.metaKey) && event.key === "a") {
      event.preventDefault();
      onSelectAll?.();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      // Enter = سطر جديد داخل نفس الفقرة (default textarea behavior)
      return;
    }

    if (event.key === "ArrowUp" && isAtStart) {
      event.preventDefault();
      moveFocus("up");
      return;
    }

    if (event.key === "ArrowDown" && isAtEnd) {
      event.preventDefault();
      moveFocus("down");
      return;
    }

    if (event.key === "Backspace" && block.text.length === 0) {
      event.preventDefault();
      onRemove(block.id);
      return;
    }

    // Convert heading to paragraph on backspace at start
    if (event.key === "Backspace" && block.type === "heading" && isAtStart) {
      event.preventDefault();
      onChange(block.id, { type: "paragraph" });
      return;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");

    // If single line without markdown block syntax, allow default paste
    const trimmed = pastedText.trim();
    const hasMultipleLines = pastedText.includes("\n");
    const hasBlockMarkdown = /^#{1,3}\s|^[-*]\s|^-\s*\[/.test(trimmed);

    if (!hasMultipleLines && !hasBlockMarkdown) {
      return; // let default paste happen
    }

    event.preventDefault();
    const blocks = parseMarkdownToBlocks(pastedText);
    onPasteBlocks?.(block.id, blocks);
  };

  return (
    <div className={cn("group flex min-h-8 items-start gap-1.5 rounded-xl px-0.5 transition duration-150", block.type === "heading" && "mt-1 mb-1", isSelectAll && "bg-[rgba(59,130,246,0.08)]")}>
      {block.type === "check" ? (
        <button
          type="button"
          aria-label={block.checked ? "مهمة مكتملة" : "مهمة غير مكتملة"}
          onClick={() => onChange(block.id, { checked: !block.checked })}
          className={cn(
            "focus-ring mt-[0.35rem] grid h-5 w-5 shrink-0 place-items-center rounded-full border transition active:scale-90",
            block.checked
              ? "border-white/0 bg-[#2f8f56] text-white"
              : "border-white/20 bg-white/[0.04] text-transparent hover:border-white/35"
          )}
        >
          <Check size={11} strokeWidth={3} />
        </button>
      ) : block.type === "list" ? (
        <span className="mt-[0.55rem] grid h-5 w-5 shrink-0 place-items-center text-white/35">
          <Minus size={14} />
        </span>
      ) : block.type === "heading" ? (
        <span className="mt-[0.55rem] grid h-5 w-5 shrink-0 place-items-center text-white/20">
          <span className="h-2 w-2 rounded-full bg-current" />
        </span>
      ) : (
        <span className="mt-[0.55rem] grid h-5 w-5 shrink-0 place-items-center text-transparent">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}

      <textarea
        ref={textareaRef}
        data-block-input={block.id}
        value={block.text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        rows={1}
        placeholder={
          block.type === "heading"
            ? "اكتب عنوان..."
            : block.type === "check"
              ? "مهمة جديدة..."
              : block.type === "list"
                ? "عنصر قائمة..."
                : "اكتب نصك هنا..."
        }
        className={cn(
          "min-h-8 flex-1 overflow-hidden bg-transparent py-[0.35rem] text-right outline-none transition-colors placeholder:text-white/20",
          block.type === "heading"
            ? "text-[calc(1.15rem*var(--note-font-scale))] font-bold leading-[calc(1.85rem*var(--note-line-height-scale))] text-white/92"
            : "text-[calc(0.96rem*var(--note-font-scale))] font-normal leading-[calc(1.6rem*var(--note-line-height-scale))] text-white/80",
          block.checked && "text-white/30 line-through",
          isSelectAll && "bg-[rgba(59,130,246,0.06)]"
        )}
      />
    </div>
  );
}
