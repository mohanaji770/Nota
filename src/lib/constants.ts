import type { AppSettings } from "@/types/notes";

export const APP_NAME = "Nota";
export const APP_NAME_AR = "نوتة";
export const DEFAULT_FOLDER_ID = "inbox";
export const ARCHIVE_FOLDER_ID = "archive";

export const DEFAULT_FOLDERS = [
  { id: DEFAULT_FOLDER_ID, name: "كل الملاحظات", color: "#257244" },
  { id: "work", name: "العمل", color: "#315d9f" },
  { id: "personal", name: "شخصي", color: "#9a5b1f" }
] as const;

export const AUTOSAVE_DELAY_MS = 260;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  fontFamily: "cairo",
  noteFontScale: 1,
  noteLineHeightScale: 1,
  supabaseUrl: "",
  supabaseAnonKey: ""
};
