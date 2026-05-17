"use client";

import { Download, Plus, RotateCw, Search, Settings2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { useNotesStore } from "@/services/notes-store";
import type { NotesExport } from "@/types/notes";
import { EmptyState } from "./empty-state";
import { InstallPrompt } from "./install-prompt";
import { NoteCard } from "./note-card";
import { SyncPill } from "./sync-pill";

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const shortDays = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"
];

function buildWeekDays() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 3);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString(),
      day: shortDays[date.getDay()],
      number: date.getDate(),
      active: date.toDateString() === today.toDateString()
    };
  });
}

export function HomeScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const allNotes = useNotesStore((state) => state.notes);
  const hydrated = useNotesStore((state) => state.hydrated);
  const query = useNotesStore((state) => state.query);
  const setQuery = useNotesStore((state) => state.setQuery);
  const createNote = useNotesStore((state) => state.createNote);
  const activeFolderId = useNotesStore((state) => state.activeFolderId);
  const syncNow = useNotesStore((state) => state.syncNow);
  const exportAll = useNotesStore((state) => state.exportAll);
  const importAll = useNotesStore((state) => state.importAll);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => buildWeekDays(), []);

  const notes = useMemo(
    () =>
      allNotes.filter((note) => {
        const folderMatches =
          activeFolderId === DEFAULT_FOLDER_ID ? true : note.folderId === activeFolderId;
        if (!folderMatches) return false;
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return `${note.title} ${note.blocks.map((block) => block.text).join(" ")}`
          .toLowerCase()
          .includes(needle);
      }),
    [activeFolderId, allNotes, query]
  );

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "new") return;

    params.delete("action");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`.replace(/\?$/, ""));
    createNote(activeFolderId).then((note) => router.push(`/note/${note.id}`));
  }, [activeFolderId, createNote, hydrated, router]);

  const handleCreate = async () => {
    const note = await createNote(activeFolderId);
    router.push(`/note/${note.id}`);
  };

  const handleExport = async () => {
    const payload = await exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text) as NotesExport;
    await importAll(payload);
  };

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-[#151515] px-6 pb-[calc(92px+var(--safe-bottom))] pt-[calc(28px+var(--safe-top))] text-[#f7f7f2]">
      <header className="shrink-0">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h1 className="text-[2.05rem] font-bold leading-none tracking-normal">
              {dayNames[today.getDay()]}
            </h1>
            <p className="mt-2 text-[0.7rem] font-medium text-white/35">
              {notes.length} ملاحظة
            </p>
          </div>
          <div className="pt-1 text-left">
            <p className="text-[0.98rem] font-semibold leading-5 text-white/48">
              {today.getDate()} {monthNames[today.getMonth()]}
            </p>
            <p className="text-[0.9rem] font-semibold leading-5 text-white/32">
              {today.getFullYear()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1 text-center" aria-label="أيام الأسبوع">
          {weekDays.map((item) => (
            <div
              key={item.key}
              className={`relative rounded-[14px] px-1 py-2 transition ${
                item.active ? "bg-white/[0.055] ring-1 ring-white/[0.075]" : ""
              }`}
            >
              {!item.active && item.number === today.getDate() - 1 ? (
                <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-[#ef4444]" />
              ) : null}
              <p className="text-[0.92rem] font-semibold leading-5 text-white/22">{item.number}</p>
              <p className={`text-[0.52rem] font-bold leading-4 ${item.active ? "text-[#ff6f61]" : "text-white/30"}`}>
                {item.day}
              </p>
            </div>
          ))}
        </div>

        {searchOpen ? (
          <label className="mt-5 flex h-11 items-center gap-3 rounded-2xl bg-white/[0.055] px-4 ring-1 ring-white/[0.07]">
            <Search size={17} className="text-white/40" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="ابحث في الملاحظات"
              className="h-full min-w-0 flex-1 bg-transparent text-[0.86rem] text-white outline-none placeholder:text-white/30"
              inputMode="search"
              aria-label="بحث في الملاحظات"
            />
          </label>
        ) : null}

        <InstallPrompt />
        <div className="mt-5 border-t border-dashed border-white/[0.055]" />
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => handleImport(event.target.files?.[0])}
      />

      {!hydrated ? (
        <section className="space-y-1 pt-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[74px] animate-pulse border-b border-dashed border-white/[0.045]" />
          ))}
        </section>
      ) : notes.length === 0 ? (
        <EmptyState folderIsAll={activeFolderId === DEFAULT_FOLDER_ID} onCreate={handleCreate} />
      ) : (
        <section className="pt-1" aria-label="قائمة الملاحظات">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </section>
      )}

      {toolsOpen ? (
        <div className="fixed bottom-[calc(74px+var(--safe-bottom))] left-[max(24px,calc((100vw-430px)/2+24px))] z-30 w-40 rounded-[24px] bg-[#202020]/95 p-2 text-[0.78rem] font-semibold text-white/72 ring-1 ring-white/[0.07] backdrop-blur-xl">
          <button
            type="button"
            onClick={syncNow}
            className="flex min-h-10 w-full items-center gap-2 rounded-2xl px-3 text-right transition active:scale-[0.98]"
          >
            <RotateCw size={15} />
            مزامنة
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-10 w-full items-center gap-2 rounded-2xl px-3 text-right transition active:scale-[0.98]"
          >
            <Upload size={15} />
            استيراد
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex min-h-10 w-full items-center gap-2 rounded-2xl px-3 text-right transition active:scale-[0.98]"
          >
            <Download size={15} />
            تصدير
          </button>
        </div>
      ) : null}

      <footer className="fixed bottom-[calc(16px+var(--safe-bottom))] left-1/2 z-30 flex w-[min(320px,calc(100vw-48px))] -translate-x-1/2 items-center justify-between">
        <button
          type="button"
          onClick={() => setToolsOpen((value) => !value)}
          aria-label="الإعدادات"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.075] text-white/55 ring-1 ring-white/[0.055] transition active:scale-95"
        >
          <Settings2 size={18} />
        </button>
        <button
          type="button"
          onClick={handleCreate}
          aria-label="إنشاء ملاحظة جديدة"
          className="grid h-12 w-[68px] place-items-center rounded-[22px] bg-white/[0.075] text-white/80 ring-1 ring-white/[0.055] transition active:scale-95"
        >
          <Plus size={24} />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((value) => !value)}
          aria-label="بحث"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.075] text-white/55 ring-1 ring-white/[0.055] transition active:scale-95"
        >
          <Search size={19} />
        </button>
      </footer>

      <div className="fixed bottom-[calc(5px+var(--safe-bottom))] left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/85" />
      <div className="sr-only">
        <SyncPill />
      </div>
    </main>
  );
}
