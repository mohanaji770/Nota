"use client";

import { ListChecks, Plus, Search, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FOLDER_ID } from "@/lib/constants";
import { useNotesStore } from "@/services/notes-store";
import { cn } from "@/lib/cn";
import { EmptyState } from "./empty-state";
import { InstallPrompt } from "./install-prompt";
import { NoteCard } from "./note-card";
import { SyncPill } from "./sync-pill";

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const shortDays = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const allNotes = useNotesStore((state) => state.notes);
  const hydrated = useNotesStore((state) => state.hydrated);
  const query = useNotesStore((state) => state.query);
  const setQuery = useNotesStore((state) => state.setQuery);
  const createNote = useNotesStore((state) => state.createNote);
  const activeFolderId = useNotesStore((state) => state.activeFolderId);
  const [searchOpen, setSearchOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => buildWeekDays(), []);

  useEffect(() => {
    router.prefetch("/settings");
    router.prefetch("/habits");
  }, [router]);

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
    if (params.get("focus") === "search") {
      params.delete("focus");
      setSearchOpen(true);
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`.replace(/\?$/, ""));
      requestAnimationFrame(() => searchInputRef.current?.focus());
      return;
    }

    if (params.get("action") !== "new") return;
    params.delete("action");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`.replace(/\?$/, ""));
    createNote(activeFolderId)
      .then((note) => router.push(`/note/${note.id}`))
      .catch(() => undefined);
  }, [activeFolderId, createNote, hydrated, router]);

  const handleCreate = async () => {
    try {
      const note = await createNote(activeFolderId);
      router.push(`/note/${note.id}`);
    } catch {
      // The global status toast displays the storage failure.
    }
  };

  return (
    <main className="adaptive-tonal mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-x-hidden bg-surface px-6 pb-[calc(92px+var(--safe-bottom))] pt-[calc(22px+var(--safe-top))] dark:bg-surface-dark">
      <header className="shrink-0">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h1 className="text-[2.05rem] font-bold leading-none tracking-tight text-white/88">
              {dayNames[today.getDay()]}
            </h1>
            <p className="mt-2 text-[0.72rem] font-medium text-white/30">{notes.length} ملاحظة</p>
          </div>
          <div className="pt-1 text-left">
            <p className="text-[0.98rem] font-semibold leading-5 text-white/44">
              {today.getDate()} {monthNames[today.getMonth()]}
            </p>
            <p className="text-[0.9rem] font-semibold leading-5 text-white/28">{today.getFullYear()}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1 text-center" aria-label="أيام الأسبوع">
          {weekDays.map((item) => (
            <div
              key={item.key}
              className={cn(
                "relative rounded-xl px-1 py-2 transition",
                item.active && "bg-white/[0.06] ring-1 ring-white/[0.08]"
              )}
            >
              {!item.active && item.number === today.getDate() - 1 ? (
                <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-destructive" />
              ) : null}
              <p className="text-[0.92rem] font-semibold leading-5 text-white/20">{item.number}</p>
              <p className={cn(
                "text-[0.52rem] font-bold leading-4",
                item.active ? "text-accent" : "text-white/28"
              )}>
                {item.day}
              </p>
            </div>
          ))}
        </div>

        {searchOpen ? (
          <label className="mt-5 flex h-11 items-center gap-3 rounded-xl bg-white/[0.06] px-4 ring-1 ring-white/[0.07]">
            <Search size={17} className="text-white/35" aria-hidden />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="ابحث في الملاحظات"
              className="h-full min-w-0 flex-1 bg-transparent text-[0.86rem] text-white/80 outline-none placeholder:text-white/25"
              inputMode="search"
              aria-label="بحث في الملاحظات"
            />
          </label>
        ) : null}

        <InstallPrompt />
        <div className="mt-5 border-t border-white/[0.06]" />
      </header>

      {!hydrated ? (
        <section className="space-y-1 pt-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[74px] animate-pulse rounded-xl bg-white/[0.04]" />
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

      <footer className="fixed bottom-[calc(16px+var(--safe-bottom))] left-1/2 z-30 flex w-[min(360px,calc(100vw-40px))] -translate-x-1/2 items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          aria-label="الإعدادات"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08] text-white/52 ring-1 ring-white/[0.06] transition active:scale-95"
        >
          <Settings2 size={18} />
        </button>
        <button
          type="button"
          onClick={handleCreate}
          aria-label="إنشاء ملاحظة جديدة"
          className="grid h-12 w-[68px] place-items-center rounded-2xl bg-white/[0.08] text-white/76 ring-1 ring-white/[0.06] transition active:scale-95"
        >
          <Plus size={24} />
        </button>
        <button
          type="button"
          onClick={() => router.push("/habits")}
          aria-label="العادات"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08] text-white/52 ring-1 ring-white/[0.06] transition active:scale-95"
        >
          <ListChecks size={18} />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((value) => !value)}
          aria-label="بحث"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08] text-white/52 ring-1 ring-white/[0.06] transition active:scale-95"
        >
          <Search size={19} />
        </button>
      </footer>

      <div className="sr-only">
        <SyncPill />
      </div>
    </main>
  );
}
