export type BlockType = "paragraph" | "heading" | "list" | "numbered_list" | "check" | "blockquote";

export type NoteBlock = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  blocks: NoteBlock[];
  folderId: string;
  pinned: boolean;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  syncState: "pending" | "synced";
  remoteUpdatedAt?: string;
};

export type SyncQueueItem = {
  id: string;
  noteId: string;
  action: "upsert" | "delete";
  createdAt: string;
};

export type ThemePreference = "system" | "light" | "dark";

export type AppFontFamily = "cairo" | "amiri";

export type AppSettings = {
  fontFamily: AppFontFamily;
  noteFontScale: number;
  noteLineHeightScale: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type Habit = {
  id: string;
  title: string;
  reminderTime: string | null;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
};

export type NotesExport = {
  version: 1;
  exportedAt: string;
  notes: Note[];
  folders: Folder[];
};
