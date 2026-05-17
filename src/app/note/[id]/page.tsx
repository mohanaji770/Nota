import { NoteEditorScreen } from "@/components/editor/note-editor-screen";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NoteEditorScreen noteId={id} />;
}
