"use client";

import {
  ArrowRight,
  CheckSquare,
  Heading1,
  List,
  ListTodo,
  MoreHorizontal,
  Pin,
  PinOff,
  Redo2,
  Trash2,
  Undo2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { AUTOSAVE_DELAY_MS } from "@/lib/constants";
import { createBlock, deriveTitle } from "@/lib/notes";
import { useNotesStore } from "@/services/notes-store";
import type { Note, NoteBlock } from "@/types/notes";
import { EditorBlock } from "./note-block";

const QUICK_TYPES = [
  { type: "paragraph", label: "نص" },
  { type: "heading", label: "عنوان" },
  { type: "list", label: "قائمة" },
  { type: "check", label: "مهمة" },
] as const;

export function NoteEditorScreen({ noteId }: { noteId: string }) {
  const router = useRouter();
  const storeNote = useNotesStore((state) => state.notes.find((note) => note.id === noteId));
  const hydrated = useNotesStore((state) => state.hydrated);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const togglePin = useNotesStore((state) => state.togglePin);
  const createNote = useNotesStore((state) => state.createNote);
  const [draft, setDraft] = useState<Note | null>(storeNote ?? null);
  const [savedAt, setSavedAt] = useState<string>("محفوظ");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const undoStack = useRef<NoteBlock[][]>([]);
  const redoStack = useRef<NoteBlock[][]>([]);

  useEffect(() => {
    if (storeNote) setDraft(storeNote);
  }, [storeNote]);

  useEffect(() => {
    if (!hydrated || draft) return;
    createNote()
      .then((note) => {
        if (note.id !== noteId) router.replace(`/note/${note.id}`);
      })
      .catch(() => undefined);
  }, [createNote, draft, hydrated, noteId, router]);

  // Exit select-all mode on click or keydown (except copy/cut/paste/selectAll shortcuts)
  useEffect(() => {
    if (!selectAllMode) return;
    const handle = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey)) {
        const allowed = new Set(["a", "c", "x", "v"]);
        if (allowed.has(e.key.toLowerCase())) return;
      }
      setSelectAllMode(false);
    };
    document.addEventListener("click", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("click", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [selectAllMode]);

  // Copy all blocks when select-all mode is active
  useEffect(() => {
    if (!selectAllMode || !draft) return;
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = draft.blocks
        .map((b) => {
          if (b.type === "heading") return `# ${b.text}`;
          if (b.type === "list") return `- ${b.text}`;
          if (b.type === "numbered_list") return `1. ${b.text}`;
          if (b.type === "check") return `- [${b.checked ? "x" : " "}] ${b.text}`;
          if (b.type === "blockquote") return `> ${b.text}`;
          return b.text;
        })
        .join("\n");
      e.clipboardData?.setData("text/plain", text);
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [selectAllMode, draft]);

  const debouncedSave = useDebouncedCallback(async (note: Note) => {
    setSavedAt("جاري الحفظ...");
    await updateNote(note);
    setSavedAt("محفوظ");
  }, AUTOSAVE_DELAY_MS);

  const commitBlocks = useCallback(
    (blocks: NoteBlock[], recordHistory = true) => {
      setDraft((current) => {
        if (!current) return current;
        if (recordHistory) {
          undoStack.current.push(current.blocks);
          if (undoStack.current.length > 40) undoStack.current.shift();
          redoStack.current = [];
        }
        const next = { ...current, blocks, title: deriveTitle(blocks) };
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave]
  );

  const updateBlock = (blockId: string, patch: Partial<NoteBlock>) => {
    if (!draft) return;
    commitBlocks(draft.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  };

  const addBlockAfter = (blockId: string, type: NoteBlock["type"] = "paragraph") => {
    if (!draft) return;
    const index = draft.blocks.findIndex((block) => block.id === blockId);
    const next = [...draft.blocks];
    next.splice(index + 1, 0, createBlock(type));
    commitBlocks(next);
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>(`[data-block-input="${next[index + 1]?.id}"]`)?.focus();
    });
  };

  const removeBlock = (blockId: string) => {
    if (!draft || draft.blocks.length === 1) return;
    const index = draft.blocks.findIndex((block) => block.id === blockId);
    const next = draft.blocks.filter((block) => block.id !== blockId);
    commitBlocks(next);
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>(`[data-block-input="${next[Math.max(0, index - 1)]?.id}"]`)?.focus();
    });
  };

  const replaceBlockWithBlocks = (blockId: string, newBlocks: NoteBlock[]) => {
    if (!draft || newBlocks.length === 0) return;
    const index = draft.blocks.findIndex((block) => block.id === blockId);
    const next = [...draft.blocks];
    next.splice(index, 1, ...newBlocks);
    commitBlocks(next);
    requestAnimationFrame(() => {
      const lastBlock = newBlocks[newBlocks.length - 1];
      document.querySelector<HTMLTextAreaElement>(`[data-block-input="${lastBlock.id}"]`)?.focus();
    });
  };

  const undo = () => {
    if (!draft || undoStack.current.length === 0) return;
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(draft.blocks);
    commitBlocks(previous, false);
  };

  const redo = () => {
    if (!draft || redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(draft.blocks);
    commitBlocks(next, false);
  };

  const addQuickBlock = (type: NoteBlock["type"]) => {
    if (!draft) return;
    setMenuOpen(false);
    const next = [...draft.blocks, createBlock(type)];
    commitBlocks(next);
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>(`[data-block-input="${next.at(-1)?.id}"]`)?.focus();
    });
  };

  const handleDelete = async () => {
    if (!draft) return;
    const confirmed = window.confirm("حذف هذه الملاحظة؟");
    if (!confirmed) return;
    await deleteNote(draft.id);
    router.push("/");
  };

  const title = useMemo(() => (draft ? deriveTitle(draft.blocks) : "ملاحظة"), [draft]);

  if (!draft) {
    return (
      <main className="adaptive-tonal grid min-h-[100dvh] place-items-center bg-surface text-sm font-medium text-white/40 dark:bg-surface-dark">
        تحميل الملاحظة...
      </main>
    );
  }

  return (
    <main className="adaptive-tonal mx-auto flex min-h-[100dvh] w-full max-w-[620px] flex-col bg-surface pb-[calc(108px+var(--safe-bottom))] pt-[var(--safe-top)] text-white dark:bg-surface-dark">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-surface/90 px-3 pt-[calc(8px+var(--safe-top))] backdrop-blur-xl dark:bg-surface-dark/90">
        <div className="flex min-h-14 items-center gap-1">
          <IconButton label="رجوع" onClick={() => router.push("/")} className="text-white/55">
            <ArrowRight size={22} />
          </IconButton>

          <div className="min-w-0 flex-1 px-2">
            <h1 className="truncate text-[0.96rem] font-semibold leading-6 text-white/86">{title}</h1>
            <p className="text-[0.68rem] font-medium leading-4 text-white/30">{savedAt}</p>
          </div>

          <IconButton
            label="المزيد"
            onClick={() => setMenuOpen((value) => !value)}
            active={menuOpen}
            className="text-white/55"
          >
            <MoreHorizontal size={21} />
          </IconButton>
        </div>
      </header>

      {/* Menu */}
      {menuOpen ? (
        <div className="fixed right-[max(14px,calc((100vw-620px)/2+14px))] top-[calc(70px+var(--safe-top))] z-30 w-52 rounded-2xl bg-white/[0.96] p-2 text-[0.8rem] font-semibold text-black/76 shadow-2xl ring-1 ring-black/[0.07] backdrop-blur-xl dark:bg-[#1c1c1e]/95 dark:text-white/76 dark:ring-white/[0.07]">
          <button
            type="button"
            onClick={() => addQuickBlock("paragraph")}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center text-white/40">¶</span>
            نص عادي
          </button>
          <button
            type="button"
            onClick={() => addQuickBlock("list")}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center text-white/40">
              <List size={16} />
            </span>
            قائمة نقطية
          </button>
          <button
            type="button"
            onClick={() => addQuickBlock("numbered_list")}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center text-white/40">
              <List size={16} />
            </span>
            قائمة مرقمة
          </button>
          <button
            type="button"
            onClick={() => addQuickBlock("check")}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center text-white/40">
              <ListTodo size={16} />
            </span>
            قائمة مهام
          </button>
          <hr className="my-1 border-white/[0.06]" />
          <button
            type="button"
            onClick={() => {
              togglePin(draft.id);
              setMenuOpen(false);
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center text-white/40">
              {draft.pinned ? <PinOff size={16} /> : <Pin size={16} />}
            </span>
            {draft.pinned ? "إلغاء التثبيت" : "تثبيت الملاحظة"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right text-destructive transition active:scale-[0.98]"
          >
            <span className="grid h-6 w-6 place-items-center">
              <Trash2 size={16} />
            </span>
            حذف الملاحظة
          </button>
        </div>
      ) : null}

      {/* Editor */}
      <section className="flex-1 px-5 py-6" aria-label="محرر الملاحظة">
        <div className="mx-auto max-w-prose space-y-1">
          {draft.blocks.map((block, i) => {
            let listNumber = 1;
            if (block.type === "numbered_list") {
              listNumber = i + 1;
              for (let j = i - 1; j >= 0; j--) {
                if (draft.blocks[j].type !== "numbered_list") break;
                listNumber = j + 1;
              }
              listNumber = draft.blocks.slice(0, i).filter((b) => b.type === "numbered_list").length + 1;
            }
            return (
              <EditorBlock
                key={block.id}
                block={block}
                isFirst={i === 0}
                listNumber={listNumber}
                onChange={updateBlock}
                onEnter={addBlockAfter}
                onRemove={removeBlock}
                onPasteBlocks={replaceBlockWithBlocks}
                onSelectAll={() => setSelectAllMode(true)}
                isSelectAll={selectAllMode}
              />
            );
          })}
        </div>
      </section>

      {/* Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-[620px] bg-surface/88 px-5 pb-[calc(16px+var(--safe-bottom))] pt-3 backdrop-blur-xl dark:bg-surface-dark/88">
        <div className="mx-auto flex max-w-[400px] items-center justify-between">
          <IconButton
            label="تراجع"
            onClick={undo}
            disabled={undoStack.current.length === 0}
            className="text-white/62"
          >
            <Undo2 size={20} />
          </IconButton>

          <div className="flex items-center gap-0.5 rounded-full bg-white/[0.08] p-0.5">
            {QUICK_TYPES.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => addQuickBlock(type)}
                className="rounded-full px-3 py-1.5 text-[0.72rem] font-bold text-white/60 transition hover:text-white/80 active:scale-95"
                aria-label={label}
              >
                {label}
              </button>
            ))}
          </div>

          <IconButton
            label="إعادة"
            onClick={redo}
            disabled={redoStack.current.length === 0}
            className="text-white/62"
          >
            <Redo2 size={20} />
          </IconButton>
        </div>
      </footer>
    </main>
  );
}
