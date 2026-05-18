import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DEFAULT_FOLDERS } from "@/lib/constants";
import { nowIso } from "@/lib/date";
import type { AppSettings, Folder, Habit, Note, SyncQueueItem, ThemePreference } from "@/types/notes";

type SettingValue = string | number | boolean | null | AppSettings;

interface NotesDatabase extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: {
      "by-updated": string;
      "by-folder": string;
      "by-pin": number;
    };
  };
  folders: {
    key: string;
    value: Folder;
  };
  outbox: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      "by-created": string;
      "by-note": string;
    };
  };
  habits: {
    key: string;
    value: Habit;
    indexes: {
      "by-updated": string;
    };
  };
  settings: {
    key: string;
    value: SettingValue;
  };
}

let dbPromise: Promise<IDBPDatabase<NotesDatabase>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<NotesDatabase>("android-notes-db", 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("notes")) {
          const notes = db.createObjectStore("notes", { keyPath: "id" });
          notes.createIndex("by-updated", "updatedAt");
          notes.createIndex("by-folder", "folderId");
          notes.createIndex("by-pin", "pinned");
        }

        if (!db.objectStoreNames.contains("folders")) {
          db.createObjectStore("folders", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("outbox")) {
          const outbox = db.createObjectStore("outbox", { keyPath: "id" });
          outbox.createIndex("by-created", "createdAt");
          outbox.createIndex("by-note", "noteId");
        }

        if (!db.objectStoreNames.contains("habits")) {
          const habits = db.createObjectStore("habits", { keyPath: "id" });
          habits.createIndex("by-updated", "updatedAt");
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      }
    });
  }

  return dbPromise;
}

export async function ensureDefaultFolders() {
  const db = await getDb();
  const count = await db.count("folders");
  if (count > 0) return;

  const timestamp = nowIso();
  const tx = db.transaction("folders", "readwrite");
  await Promise.all(
    DEFAULT_FOLDERS.map((folder) =>
      tx.store.put({ ...folder, createdAt: timestamp, updatedAt: timestamp })
    )
  );
  await tx.done;
}

export async function getSetting<T extends SettingValue>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const value = await db.get("settings", key);
  return (value ?? fallback) as T;
}

export async function setSetting<T extends SettingValue>(key: string, value: T) {
  const db = await getDb();
  await db.put("settings", value, key);
}

export async function getThemeSetting() {
  return getSetting<ThemePreference>("theme", "system");
}
