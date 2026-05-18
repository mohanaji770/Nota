"use client";

import { create } from "zustand";
import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { nowIso } from "@/lib/date";
import { createId } from "@/lib/id";
import { createEmptyNote, deriveTitle, noteMatchesQuery } from "@/lib/notes";
import {
  clearOutbox,
  deleteHabit as deleteHabitFromStorage,
  drainOutbox,
  exportNotes as exportFromStorage,
  getDeviceId,
  getLastSyncAt,
  importNotes as importIntoStorage,
  loadAppSettings,
  listHabits,
  listFolders,
  listNotes,
  loadTheme,
  markNotesSynced,
  saveAppSettings,
  saveHabit,
  saveNote,
  saveRemoteMergedNotes,
  saveTheme,
  setLastSyncAt
} from "@/storage/repository";
import { isSupabaseConfigured, syncWithSupabase } from "@/services/sync/supabase";
import { DEFAULT_APP_SETTINGS } from "@/lib/constants";
import type { AppSettings, Folder, Habit, Note, NotesExport, ThemePreference } from "@/types/notes";

type SyncStatus = "idle" | "local" | "syncing" | "synced" | "error";

type NotesState = {
  notes: Note[];
  habits: Habit[];
  folders: Folder[];
  query: string;
  activeFolderId: string;
  hydrated: boolean;
  theme: ThemePreference;
  settings: AppSettings;
  syncStatus: SyncStatus;
  syncError: string | null;
  operationError: string | null;
  hydrate: () => Promise<void>;
  createNote: (folderId?: string) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  createHabit: (input: { title: string; reminderTime?: string | null }) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  restoreHabit: (habit: Habit) => Promise<void>;
  toggleHabitDate: (habitId: string, dateKey: string) => Promise<void>;
  setQuery: (query: string) => void;
  setFolder: (folderId: string) => void;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  syncNow: () => Promise<void>;
  exportAll: () => Promise<NotesExport>;
  importAll: (payload: NotesExport) => Promise<void>;
  clearOperationError: () => void;
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
  habits: [],
  folders: [],
  query: "",
  activeFolderId: DEFAULT_FOLDER_ID,
  hydrated: false,
  theme: "system",
  settings: DEFAULT_APP_SETTINGS,
  syncStatus: isSupabaseConfigured() ? "idle" : "local",
  syncError: null,
  operationError: null,

  async hydrate() {
    const [notes, folders, habits, theme, settings] = await Promise.all([
      listNotes(),
      listFolders(),
      listHabits(),
      loadTheme(),
      loadAppSettings()
    ]);
    set({
      notes,
      folders,
      habits,
      theme,
      settings,
      hydrated: true,
      syncStatus: isSupabaseConfigured(settings) ? "idle" : "local"
    });
  },

  async createNote(folderId) {
    const note = createEmptyNote(folderId || get().activeFolderId || DEFAULT_FOLDER_ID);
    set((state) => ({ notes: updateNoteInList([note, ...state.notes], note) }));
    try {
      await saveNote(note);
      set({ operationError: null });
      return note;
    } catch (error) {
      set((state) => ({
        notes: state.notes.filter((item) => item.id !== note.id),
        operationError: "تعذر حفظ الملاحظة محليًا. تأكد من مساحة التخزين ثم حاول مرة أخرى."
      }));
      throw error;
    }
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

  async createHabit(input) {
    const timestamp = nowIso();
    const habit: Habit = {
      id: createId("habit"),
      title: input.title.trim(),
      reminderTime: input.reminderTime || null,
      completedDates: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    if (!habit.title) return;
    set((state) => ({ habits: [habit, ...state.habits] }));
    try {
      await saveHabit(habit);
      set({ operationError: null });
    } catch (error) {
      set((state) => ({
        habits: state.habits.filter((item) => item.id !== habit.id),
        operationError: "تعذر حفظ العادة محليًا. حاول مرة أخرى."
      }));
      throw error;
    }
  },

  async updateHabit(habit) {
    const next = { ...habit, updatedAt: nowIso() };
    set((state) => ({ habits: state.habits.map((item) => (item.id === next.id ? next : item)) }));
    await saveHabit(next);
  },

  async deleteHabit(id) {
    const previous = get().habits;
    set((state) => ({ habits: state.habits.filter((habit) => habit.id !== id) }));
    try {
      await deleteHabitFromStorage(id);
      set({ operationError: null });
    } catch (error) {
      set({ habits: previous, operationError: "تعذر حذف العادة. حاول مرة أخرى." });
      throw error;
    }
  },

  async restoreHabit(habit) {
    const next = { ...habit, updatedAt: nowIso() };
    set((state) => ({
      habits: [next, ...state.habits.filter((item) => item.id !== next.id)].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }));
    try {
      await saveHabit(next);
      set({ operationError: null });
    } catch (error) {
      set((state) => ({
        habits: state.habits.filter((item) => item.id !== next.id),
        operationError: "تعذر استرجاع العادة. حاول مرة أخرى."
      }));
      throw error;
    }
  },

  async toggleHabitDate(habitId, dateKey) {
    const habit = get().habits.find((item) => item.id === habitId);
    if (!habit) return;

    const exists = habit.completedDates.includes(dateKey);
    const next: Habit = {
      ...habit,
      completedDates: exists
        ? habit.completedDates.filter((item) => item !== dateKey)
        : [...habit.completedDates, dateKey],
      updatedAt: nowIso()
    };
    set((state) => ({ habits: state.habits.map((item) => (item.id === habitId ? next : item)) }));
    await saveHabit(next);
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

  async setAppSettings(nextSettings) {
    const settings = {
      ...get().settings,
      ...nextSettings
    };
    set({ settings });
    await saveAppSettings(settings);
  },

  async syncNow() {
    const settings = get().settings;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ syncStatus: isSupabaseConfigured(settings) ? "idle" : "local", syncError: null });
      return;
    }

    if (!isSupabaseConfigured(settings)) {
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
      const result = await syncWithSupabase({
        ownerId,
        outbox,
        lastSyncAt,
        notes: allNotes,
        credentials: settings
      });

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
  },

  clearOperationError() {
    set({ operationError: null, syncError: null });
  }
}));

export function selectVisibleNotes(state: NotesState) {
  return state.notes.filter((note) => {
    const folderMatches =
      state.activeFolderId === DEFAULT_FOLDER_ID ? true : note.folderId === state.activeFolderId;
    return folderMatches && noteMatchesQuery(note, state.query);
  });
}
