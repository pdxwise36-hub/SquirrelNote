export type NoteSource = "manual" | "granola" | (string & {});
export type NoteKind = "note" | "checklist";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  kind: NoteKind;
  source: NoteSource;
  source_id: string | null;
  summary: string | null;
  pinned: boolean;
  color: string | null;
  tags: string[];
  folder: string | null;
  items: ChecklistItem[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type NewNote = Partial<
  Pick<
    Note,
    | "title"
    | "content"
    | "kind"
    | "source"
    | "source_id"
    | "tags"
    | "folder"
    | "items"
    | "metadata"
  >
>;

export type NoteUpdate = Partial<
  Pick<
    Note,
    | "title"
    | "content"
    | "summary"
    | "pinned"
    | "color"
    | "tags"
    | "folder"
    | "items"
    | "kind"
    | "metadata"
  >
>;
