import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { nowIso } from "@/lib/date";
import { createId } from "@/lib/id";
import type { Note, NoteBlock } from "@/types/notes";

export function createEmptyNote(folderId = DEFAULT_FOLDER_ID): Note {
  const timestamp = nowIso();

  return {
    id: createId("note"),
    title: "ملاحظة جديدة",
    blocks: [{ id: createId("block"), type: "paragraph", text: "" }],
    folderId,
    pinned: false,
    archived: false,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncState: "pending"
  };
}

export function getPlainText(blocks: NoteBlock[]) {
  return blocks.map((block) => block.text.trim()).filter(Boolean).join(" ");
}

export function deriveTitle(blocks: NoteBlock[]) {
  const first = blocks.find((block) => block.text.trim().length > 0);
  if (!first) return "ملاحظة جديدة";
  return first.text.trim().replace(/^#+\s*/, "").slice(0, 80);
}

export function getExcerpt(blocks: NoteBlock[]) {
  const text = getPlainText(blocks);
  if (!text) return "لا يوجد نص بعد";
  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

export function normalizeBlockFromText(block: NoteBlock): NoteBlock {
  const value = block.text;

  if (value.startsWith("# ")) {
    return { ...block, type: "heading", text: value.replace(/^#\s*/, "") };
  }

  if (value.startsWith("- [ ] ")) {
    return { ...block, type: "check", checked: false, text: value.replace(/^- \[ \]\s*/, "") };
  }

  if (value.startsWith("- [x] ") || value.startsWith("- [X] ")) {
    return { ...block, type: "check", checked: true, text: value.replace(/^- \[[xX]\]\s*/, "") };
  }

  if (value.startsWith("- ")) {
    return { ...block, type: "list", text: value.replace(/^-\s*/, "") };
  }

  return block;
}

export function createBlock(type: NoteBlock["type"] = "paragraph"): NoteBlock {
  return {
    id: createId("block"),
    type,
    text: "",
    checked: type === "check" ? false : undefined
  };
}

export function noteMatchesQuery(note: Note, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return `${note.title} ${getPlainText(note.blocks)}`.toLowerCase().includes(needle);
}
