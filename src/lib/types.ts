export type NoteSource = "manual" | "granola" | (string & {});

export interface Note {
  id: string;
  title: string;
  content: string;
  source: NoteSource;
  source_id: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type NewNote = Pick<Note, "title" | "content"> &
  Partial<Pick<Note, "source" | "source_id" | "metadata">>;

export type NoteUpdate = Partial<
  Pick<Note, "title" | "content" | "summary" | "metadata">
>;
