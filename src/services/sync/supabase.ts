import type { Note, SyncQueueItem } from "@/types/notes";

type SupabaseNoteRow = {
  id: string;
  owner_id: string;
  title: string;
  blocks: Note["blocks"];
  folder_id: string;
  pinned: boolean;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function toRow(note: Note, ownerId: string): SupabaseNoteRow {
  return {
    id: note.id,
    owner_id: ownerId,
    title: note.title,
    blocks: note.blocks,
    folder_id: note.folderId,
    pinned: note.pinned,
    archived: note.archived,
    deleted_at: note.deletedAt,
    created_at: note.createdAt,
    updated_at: note.updatedAt
  };
}

function fromRow(row: SupabaseNoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    blocks: row.blocks,
    folderId: row.folder_id,
    pinned: row.pinned,
    archived: row.archived,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    remoteUpdatedAt: row.updated_at,
    syncState: "synced"
  };
}

export async function syncWithSupabase(input: {
  ownerId: string;
  notes: Note[];
  outbox: SyncQueueItem[];
  lastSyncAt: string | null;
}) {
  if (!isSupabaseConfigured()) {
    return { enabled: false as const, mergedNotes: [], syncedIds: [] };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const changedIds = new Set(input.outbox.map((item) => item.noteId));
  const changedNotes = input.notes.filter((note) => changedIds.has(note.id));

  if (changedNotes.length > 0) {
    const { error } = await client.from("notes").upsert(
      changedNotes.map((note) => toRow(note, input.ownerId)),
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  let query = client.from("notes").select("*").eq("owner_id", input.ownerId);
  if (input.lastSyncAt) query = query.gt("updated_at", input.lastSyncAt);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return {
    enabled: true as const,
    mergedNotes: (data ?? []).map((row) => fromRow(row as SupabaseNoteRow)),
    syncedIds: changedNotes.map((note) => note.id)
  };
}
