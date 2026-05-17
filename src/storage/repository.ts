import { createId } from "@/lib/id";
import { nowIso } from "@/lib/date";
import type { Folder, Note, NotesExport, SyncQueueItem, ThemePreference } from "@/types/notes";
import { ensureDefaultFolders, getDb, getSetting, getThemeSetting, setSetting } from "./db";

export async function listFolders(): Promise<Folder[]> {
  await ensureDefaultFolders();
  const db = await getDb();
  return db.getAll("folders");
}

export async function listNotes(options: { includeArchived?: boolean; includeDeleted?: boolean } = {}) {
  const db = await getDb();
  const notes = await db.getAll("notes");

  return notes
    .filter((note) => (options.includeDeleted ? true : !note.deletedAt))
    .filter((note) => (options.includeArchived ? true : !note.archived))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export async function getNote(id: string) {
  const db = await getDb();
  return db.get("notes", id);
}

export async function saveNote(note: Note, action: SyncQueueItem["action"] = "upsert") {
  const db = await getDb();
  const timestamp = nowIso();
  const tx = db.transaction(["notes", "outbox"], "readwrite");
  await tx.objectStore("notes").put({ ...note, syncState: "pending" });
  await tx.objectStore("outbox").put({
    id: createId("queue"),
    noteId: note.id,
    action,
    createdAt: timestamp
  });
  await tx.done;
}

export async function saveRemoteMergedNotes(notes: Note[]) {
  const db = await getDb();
  const tx = db.transaction("notes", "readwrite");
  await Promise.all(notes.map((note) => tx.store.put({ ...note, syncState: "synced" })));
  await tx.done;
}

export async function markNotesSynced(ids: string[]) {
  if (ids.length === 0) return;

  const db = await getDb();
  const tx = db.transaction("notes", "readwrite");
  await Promise.all(
    ids.map(async (id) => {
      const note = await tx.store.get(id);
      if (note) await tx.store.put({ ...note, syncState: "synced", remoteUpdatedAt: nowIso() });
    })
  );
  await tx.done;
}

export async function drainOutbox() {
  const db = await getDb();
  return db.getAll("outbox");
}

export async function clearOutbox(items: SyncQueueItem[]) {
  const db = await getDb();
  const tx = db.transaction("outbox", "readwrite");
  await Promise.all(items.map((item) => tx.store.delete(item.id)));
  await tx.done;
}

export async function upsertFolder(folder: Folder) {
  const db = await getDb();
  await db.put("folders", folder);
}

export async function getDeviceId() {
  const existing = await getSetting<string | null>("deviceId", null);
  if (existing) return existing;

  const id = createId("device");
  await setSetting("deviceId", id);
  return id;
}

export async function getLastSyncAt() {
  return getSetting<string | null>("lastSyncAt", null);
}

export async function setLastSyncAt(value: string) {
  await setSetting("lastSyncAt", value);
}

export async function loadTheme() {
  return getThemeSetting();
}

export async function saveTheme(value: ThemePreference) {
  await setSetting("theme", value);
}

export async function exportNotes(): Promise<NotesExport> {
  const [notes, folders] = await Promise.all([
    listNotes({ includeArchived: true, includeDeleted: true }),
    listFolders()
  ]);

  return {
    version: 1,
    exportedAt: nowIso(),
    notes,
    folders
  };
}

export async function importNotes(payload: NotesExport) {
  const db = await getDb();
  const tx = db.transaction(["notes", "folders", "outbox"], "readwrite");
  await Promise.all([
    ...payload.folders.map((folder) => tx.objectStore("folders").put(folder)),
    ...payload.notes.map((note) => tx.objectStore("notes").put({ ...note, syncState: "pending" })),
    ...payload.notes.map((note) =>
      tx.objectStore("outbox").put({
        id: createId("queue"),
        noteId: note.id,
        action: note.deletedAt ? "delete" : "upsert",
        createdAt: nowIso()
      })
    )
  ]);
  await tx.done;
}
