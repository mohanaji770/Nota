"use client";

import { useParams } from "next/navigation";
import { NoteEditorScreen } from "@/components/editor/note-editor-screen";

export default function NotePage() {
  const params = useParams<{ id: string }>();
  return <NoteEditorScreen noteId={params.id} />;
}
