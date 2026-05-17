"use client";

import { Check, Circle, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatUpdatedAt } from "@/lib/date";
import { getExcerpt } from "@/lib/notes";
import type { Note } from "@/types/notes";

export function NoteCard({ note }: { note: Note }) {
  const router = useRouter();

  return (
    <article className="border-b border-dashed border-white/[0.055]">
      <button
        type="button"
        onClick={() => router.push(`/note/${note.id}`)}
        className="flex min-h-[70px] w-full items-center gap-3 py-3 text-right transition duration-200 ease-material active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-[0.95rem] font-semibold leading-6 text-white/78">
            {note.title}
          </h2>
          <p className="mt-0.5 line-clamp-1 text-[0.76rem] font-medium leading-5 text-white/32">
            {getExcerpt(note.blocks)}
          </p>
        </div>

        <div className="flex w-12 shrink-0 flex-col items-end gap-3 text-left">
          <time className="text-[0.68rem] font-medium text-white/25">{formatUpdatedAt(note.updatedAt)}</time>
          {note.syncState === "pending" ? (
            <Circle size={15} className="text-white/18" />
          ) : note.pinned ? (
            <Moon size={15} className="text-[#7c4dff]" />
          ) : (
            <Check size={15} className="text-white/22" />
          )}
        </div>
      </button>
    </article>
  );
}
