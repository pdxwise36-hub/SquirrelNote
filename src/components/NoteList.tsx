"use client";

import type { Note } from "@/lib/types";
import { usePrefs } from "@/lib/prefs";

function preview(note: Note): string {
  if (note.kind === "checklist") {
    const items = note.items ?? [];
    const done = items.filter((i) => i.checked).length;
    return items.length ? `${done}/${items.length} done` : "Empty checklist";
  }
  return note.content.slice(0, 90) || "Empty note";
}

function sourceLabel(source: string) {
  if (source === "granola") return "Granola";
  return null;
}

export default function NoteList({
  notes,
  selectedId,
  onSelect,
  onTogglePin,
}: {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTogglePin: (note: Note) => void;
}) {
  const { prefs } = usePrefs();

  if (notes.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted">No notes here yet.</p>
    );
  }

  const grid = prefs.view === "grid";

  return (
    <ul
      className={
        grid
          ? "grid grid-cols-2 gap-2 p-2"
          : "flex flex-col"
      }
    >
      {notes.map((note) => {
        const active = selectedId === note.id;
        const src = sourceLabel(note.source);
        return (
          <li key={note.id}>
            <button
              onClick={() => onSelect(note.id)}
              style={{ paddingTop: "var(--row-pad-y)", paddingBottom: "var(--row-pad-y)" }}
              className={`group relative flex w-full flex-col gap-1 px-3 text-left transition ${
                grid
                  ? `rounded-app border ${active ? "border-accent" : ""} bg-surface hover:bg-surface-2`
                  : `border-b ${active ? "bg-accent-soft" : "hover:bg-surface-2"}`
              }`}
            >
              {note.color && (
                <span
                  className="absolute left-0 top-0 h-full w-1 rounded-l-app"
                  style={{ background: note.color }}
                />
              )}
              <div className="flex items-center gap-2">
                {note.kind === "checklist" && (
                  <span className="text-xs text-muted">✓</span>
                )}
                <span className="flex-1 truncate font-medium">
                  {note.title || "Untitled"}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(note);
                  }}
                  className={`cursor-pointer text-sm ${
                    note.pinned
                      ? "text-accent"
                      : "text-transparent group-hover:text-muted"
                  }`}
                  title={note.pinned ? "Unpin" : "Pin"}
                >
                  ★
                </span>
              </div>
              <span className="truncate text-xs text-muted">
                {preview(note)}
              </span>
              {(note.tags?.length > 0 || src) && (
                <div className="flex flex-wrap gap-1">
                  {src && (
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      {src}
                    </span>
                  )}
                  {note.tags?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-fg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
