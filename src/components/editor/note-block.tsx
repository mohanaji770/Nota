"use client";

import { Check, Minus } from "lucide-react";
import { useRef } from "react";
import { useAutoResize } from "@/hooks/use-auto-resize";
import { cn } from "@/lib/cn";
import { normalizeBlockFromText, parseMarkdownToBlocks } from "@/lib/notes";
import type { NoteBlock } from "@/types/notes";

type EditorBlockProps = {
  block: NoteBlock;
  isFirst?: boolean;
  listNumber?: number;
  onChange: (blockId: string, patch: Partial<NoteBlock>) => void;
  onEnter: (blockId: string, type?: NoteBlock["type"]) => void;
  onRemove: (blockId: string) => void;
  onPasteBlocks?: (blockId: string, blocks: NoteBlock[]) => void;
  onSelectAll?: () => void;
  isSelectAll?: boolean;
};

const SAME_ON_ENTER: NoteBlock["type"][] = ["check", "list", "numbered_list"];

export function EditorBlock({ block, isFirst, listNumber, onChange, onEnter, onRemove, onPasteBlocks, onSelectAll, isSelectAll }: EditorBlockProps) {
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
      el.select();
      onSelectAll?.();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      // Heading: Enter = new paragraph block below (Apple Notes style)
      if (block.type === "heading") {
        event.preventDefault();
        onEnter(block.id, "paragraph");
        return;
      }
      // Check / list / numbered_list: Enter = new block of same type
      if (SAME_ON_ENTER.includes(block.type)) {
        event.preventDefault();
        if (block.text.trim().length === 0) {
          // Empty item: convert back to paragraph (exit list)
          onChange(block.id, { type: "paragraph" });
        } else {
          onEnter(block.id, block.type);
        }
      }
      // Paragraph / blockquote: Enter = newline (default)
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

    // Convert heading/numbered_list/list/blockquote to paragraph on backspace at start
    if (
      event.key === "Backspace" &&
      isAtStart &&
      (block.type === "heading" || block.type === "numbered_list" || block.type === "list" || block.type === "blockquote")
    ) {
      event.preventDefault();
      onChange(block.id, { type: "paragraph" });
      return;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const trimmed = pastedText.trim();
    const hasMultipleLines = pastedText.includes("\n");
    const hasBlockMarkdown = /^#{1,3}\s|^[-*]\s|^\d+\.\s|^>\s|^-?\s*\[/.test(trimmed);

    if (!hasMultipleLines && !hasBlockMarkdown) {
      return;
    }

    event.preventDefault();
    const blocks = parseMarkdownToBlocks(pastedText);
    onPasteBlocks?.(block.id, blocks);
  };

  const resetCheckAnimation = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.classList.remove("check-pop");
    void btn.offsetWidth;
    btn.classList.add("check-pop");
  };

  return (
    <div
      className={cn(
        "group flex min-h-8 items-start gap-2 py-[0.1rem] transition",
        block.type === "blockquote" && "pr-3 border-r-[3px] border-accent/40 bg-accent/[0.04] rounded-l-lg",
        isSelectAll && "rounded-md bg-[rgba(255,159,10,0.1)]"
      )}
    >
      {/* Block indicator */}
      {block.type === "check" ? (
        <button
          type="button"
          aria-label={block.checked ? "مهمة مكتملة" : "مهمة غير مكتملة"}
          onClick={(e) => {
            onChange(block.id, { checked: !block.checked });
            if (!block.checked) resetCheckAnimation(e);
          }}
          className={cn(
            "focus-ring mt-[0.4rem] grid h-[1.35rem] w-[1.35rem] shrink-0 place-items-center rounded-full border-2 transition-all duration-200 active:scale-90",
            block.checked
              ? "border-positive bg-positive text-white scale-100"
              : "border-white/25 bg-transparent text-transparent hover:border-white/40"
          )}
        >
          <Check size={11} strokeWidth={3.5} />
        </button>
      ) : block.type === "list" ? (
        <span className="mt-[0.58rem] grid h-[1.35rem] w-[1.35rem] shrink-0 place-items-center text-white/25">
          <Minus size={16} strokeWidth={2.5} />
        </span>
      ) : block.type === "numbered_list" ? (
        <span className="mt-[0.5rem] grid h-[1.35rem] min-w-[1.35rem] shrink-0 place-items-center text-[0.78rem] font-medium text-white/35 tabular-nums">
          {listNumber ?? 1}.
        </span>
      ) : (
        <span className="mt-[0.58rem] grid h-[1.35rem] w-[1.35rem] shrink-0 place-items-center text-transparent select-none">
          &#8203;
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
            ? isFirst ? "عنوان" : "عنوان..."
            : block.type === "check"
              ? "مهمة جديدة..."
              : block.type === "list"
                ? "عنصر قائمة..."
                : block.type === "numbered_list"
                  ? "عنصر مرقم..."
                  : block.type === "blockquote"
                    ? "اقتباس..."
                    : isFirst
                      ? "ابدأ الكتابة..."
                      : "اكتب هنا..."
        }
        className={cn(
          "min-h-8 flex-1 overflow-hidden bg-transparent py-[0.4rem] text-right outline-none placeholder:text-white/18",
          block.type === "heading"
            ? isFirst
              ? "text-[1.45rem] font-bold leading-[1.85rem] text-white/92 tracking-tight"
              : "text-[calc(1.1rem*var(--note-font-scale))] font-bold leading-[calc(1.75rem*var(--note-line-height-scale))] text-white/88"
            : block.type === "blockquote"
              ? "text-[calc(0.96rem*var(--note-font-scale))] italic leading-[calc(1.6rem*var(--note-line-height-scale))] text-white/58"
              : "text-[calc(0.96rem*var(--note-font-scale))] font-normal leading-[calc(1.6rem*var(--note-line-height-scale))] text-white/80",
          block.checked && "text-white/30 line-through"
        )}
      />
    </div>
  );
}
