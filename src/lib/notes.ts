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

  // Heading: # text
  if (value.startsWith("# ")) {
    return { ...block, type: "heading", text: value.replace(/^#\s*/, "") };
  }

  // Check: - [ ] text or - [x] text
  if (value.startsWith("- [ ] ")) {
    return { ...block, type: "check", checked: false, text: value.replace(/^- \[ \]\s*/, "") };
  }

  if (value.startsWith("- [x] ") || value.startsWith("- [X] ")) {
    return { ...block, type: "check", checked: true, text: value.replace(/^- \[[xX]\]\s*/, "") };
  }

  // List: - text
  if (value.startsWith("- ")) {
    return { ...block, type: "list", text: value.replace(/^-\s*/, "") };
  }

  // If block was a heading but user removed the #, convert back to paragraph
  if (block.type === "heading" && !value.startsWith("# ")) {
    return { ...block, type: "paragraph" };
  }

  return block;
}

export function createBlock(type: NoteBlock["type"] = "paragraph", text = ""): NoteBlock {
  return {
    id: createId("block"),
    type,
    text,
    checked: type === "check" ? false : undefined
  };
}

export function parseMarkdownToBlocks(text: string): NoteBlock[] {
  const lines = text.split("\n");
  const blocks: NoteBlock[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push(createBlock("paragraph", currentParagraph.join("\n")));
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Heading: # text or ## text or ### text
    if (/^#{1,3}\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push(createBlock("heading", trimmed.replace(/^#{1,3}\s+/, "")));
    }
    // Check: - [ ] text or - [x] text
    else if (/^-\s*\[[ xX]\]\s*/.test(trimmed)) {
      flushParagraph();
      const checked = trimmed.match(/^-\s*\[([ xX])\]/)?.[1]?.toLowerCase() === "x";
      blocks.push({ ...createBlock("check"), checked, text: trimmed.replace(/^-\s*\[[ xX]\]\s*/, "") });
    }
    // List: - text or * text
    else if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push(createBlock("list", trimmed.replace(/^[-*]\s+/, "")));
    }
    // Regular line
    else {
      currentParagraph.push(line);
    }
  }

  flushParagraph();

  return blocks.length > 0 ? blocks : [createBlock("paragraph")];
}

export function noteMatchesQuery(note: Note, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return `${note.title} ${getPlainText(note.blocks)}`.toLowerCase().includes(needle);
}
