"use client";

import { create } from "zustand";
import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { nowIso } from "@/lib/date";
import { createEmptyNote, deriveTitle, noteMatchesQuery } from "@/lib/notes";
import {
  clearOutbox,
  drainOutbox,
  exportNotes as exportFromStorage,
  getDeviceId,
  getLastSyncAt,
  importNotes as importIntoStorage,
  listFolders,
  listNotes,
  loadTheme,
  markNotesSynced,
  saveNote,
  saveRemoteMergedNotes,
  saveTheme,
  setLastSyncAt
} from "@/storage/repository";
import { isSupabaseConfigured, syncWithSupabase } from "@/services/sync/supabase";
import type { Folder, Note, NotesExport, ThemePreference } from "@/types/notes";

type SyncStatus = "idle" | "local" | "syncing" | "synced" | "error";

type NotesState = {
  notes: Note[];
  folders: Folder[];
  query: string;
  activeFolderId: string;
  hydrated: boolean;
  theme: ThemePreference;
  syncStatus: SyncStatus;
  syncError: string | null;
  hydrate: () => Promise<void>;
  createNote: (folderId?: string) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  setQuery: (query: string) => void;
  setFolder: (folderId: string) => void;
  setTheme: (theme: ThemePreference) => Promise<void>;
  syncNow: () => Promise<void>;
  exportAll: () => Promise<NotesExport>;
  importAll: (payload: NotesExport) => Promise<void>;
};

function updateNoteInList(notes: Note[], next: Note) {
  return notes
    .map((note) => (note.id === next.id ? next : note))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  query: "",
  activeFolderId: DEFAULT_FOLDER_ID,
  hydrated: false,
  theme: "system",
  syncStatus: isSupabaseConfigured() ? "idle" : "local",
  syncError: null,

  async hydrate() {
    const [notes, folders, theme] = await Promise.all([listNotes(), listFolders(), loadTheme()]);
    set({
      notes,
      folders,
      theme,
      hydrated: true,
      syncStatus: isSupabaseConfigured() ? "idle" : "local"
    });
  },

  async createNote(folderId) {
    const note = createEmptyNote(folderId || get().activeFolderId || DEFAULT_FOLDER_ID);
    set((state) => ({ notes: updateNoteInList([note, ...state.notes], note) }));
    await saveNote(note);
    return note;
  },

  async updateNote(note) {
    const timestamp = nowIso();
    const next: Note = {
      ...note,
      title: deriveTitle(note.blocks),
      updatedAt: timestamp,
      syncState: "pending"
    };
    set((state) => ({ notes: updateNoteInList(state.notes, next) }));
    await saveNote(next);
  },

  async deleteNote(id) {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;

    const next = { ...note, deletedAt: nowIso(), syncState: "pending" as const };
    set((state) => ({ notes: state.notes.filter((item) => item.id !== id) }));
    await saveNote(next, "delete");
  },

  async archiveNote(id) {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;

    const next = { ...note, archived: true, updatedAt: nowIso(), syncState: "pending" as const };
    set((state) => ({ notes: state.notes.filter((item) => item.id !== id) }));
    await saveNote(next);
  },

  async togglePin(id) {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;

    const next = { ...note, pinned: !note.pinned, updatedAt: nowIso(), syncState: "pending" as const };
    set((state) => ({ notes: updateNoteInList(state.notes, next) }));
    await saveNote(next);
  },

  setQuery(query) {
    set({ query });
  },

  setFolder(folderId) {
    set({ activeFolderId: folderId });
  },

  async setTheme(theme) {
    set({ theme });
    await saveTheme(theme);
  },

  async syncNow() {
    if (!isSupabaseConfigured()) {
      set({ syncStatus: "local", syncError: null });
      return;
    }

    set({ syncStatus: "syncing", syncError: null });
    try {
      const [ownerId, outbox, lastSyncAt, allNotes] = await Promise.all([
        getDeviceId(),
        drainOutbox(),
        getLastSyncAt(),
        listNotes({ includeArchived: true, includeDeleted: true })
      ]);
      const result = await syncWithSupabase({ ownerId, outbox, lastSyncAt, notes: allNotes });

      if (result.enabled) {
        await Promise.all([
          saveRemoteMergedNotes(result.mergedNotes),
          markNotesSynced(result.syncedIds),
          clearOutbox(outbox),
          setLastSyncAt(nowIso())
        ]);
        const notes = await listNotes();
        set({ notes, syncStatus: "synced" });
      }
    } catch (error) {
      set({
        syncStatus: "error",
        syncError: error instanceof Error ? error.message : "تعذر تنفيذ المزامنة"
      });
    }
  },

  exportAll() {
    return exportFromStorage();
  },

  async importAll(payload) {
    await importIntoStorage(payload);
    const [notes, folders] = await Promise.all([listNotes(), listFolders()]);
    set({ notes, folders });
  }
}));

export function selectVisibleNotes(state: NotesState) {
  return state.notes.filter((note) => {
    const folderMatches =
      state.activeFolderId === DEFAULT_FOLDER_ID ? true : note.folderId === state.activeFolderId;
    return folderMatches && noteMatchesQuery(note, state.query);
  });
}
