import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { nowIso } from "@/lib/date";
import { createId } from "@/lib/id";
import type { Note, NoteBlock } from "@/types/notes";

export function createEmptyNote(folderId = DEFAULT_FOLDER_ID): Note {
  const timestamp = nowIso();

  return {
    id: createId("note"),
    title: "ملاحظة جديدة",
    blocks: [{ id: createId("block"), type: "heading", text: "" }],
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

  // Check: - [ ] text or - [x] text or [] text
  if (value.startsWith("- [ ] ") || value.startsWith("[] ")) {
    return { ...block, type: "check", checked: false, text: value.replace(/^(- \[ \]|\[\])\s*/, "") };
  }

  if (value.startsWith("- [x] ") || value.startsWith("- [X] ") || value.startsWith("[x] ") || value.startsWith("[X] ")) {
    return { ...block, type: "check", checked: true, text: value.replace(/^(- \[[xX]\]|\[[xX]\])\s*/, "") };
  }

  // Numbered list: 1. text
  if (/^\d+\.\s/.test(value)) {
    return { ...block, type: "numbered_list", text: value.replace(/^\d+\.\s*/, "") };
  }

  // List: - text or * text
  if (/^[-*]\s+/.test(value)) {
    return { ...block, type: "list", text: value.replace(/^[-*]\s+/, "") };
  }

  // Blockquote: > text
  if (value.startsWith("> ")) {
    return { ...block, type: "blockquote", text: value.replace(/^>\s*/, "") };
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

export function getNextNumberedListNumber(blocks: NoteBlock[], blockId: string): string {
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return "1";
  for (let i = index; i >= 0; i--) {
    if (blocks[i].type !== "numbered_list") return "1";
    if (blocks[i].id === blockId && blocks[i].text.length > 0) {
      const currentMatch = blocks[i].text.match(/^(\d+)\.\s/);
      if (!currentMatch) {
        for (let j = i - 1; j >= 0; j--) {
          if (blocks[j].type !== "numbered_list") return "1";
          const prevMatch = blocks[j].text.match(/^(\d+)\.\s/);
          if (prevMatch) return String(Number(prevMatch[1]) + 1);
        }
      }
      return String(i - index + 1);
    }
  }
  return "1";
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

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Heading
    if (/^#{1,3}\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push(createBlock("heading", trimmed.replace(/^#{1,3}\s+/, "")));
    }
    // Check
    else if (/^[-[]\s*\[[ xX]\]\s*/.test(trimmed) || /^\[\]\s*/.test(trimmed)) {
      flushParagraph();
      const checked = /\[[xX]\]/.test(trimmed);
      blocks.push({ ...createBlock("check"), checked, text: trimmed.replace(/^[-[]?\s*\[[ xX]\]\s*/, "") });
    }
    // Numbered list
    else if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push(createBlock("numbered_list", trimmed.replace(/^\d+\.\s+/, "")));
    }
    // List
    else if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push(createBlock("list", trimmed.replace(/^[-*]\s+/, "")));
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      flushParagraph();
      blocks.push(createBlock("blockquote", trimmed.replace(/^>\s*/, "")));
    }
    // Paragraph line
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
