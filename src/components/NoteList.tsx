"use client";

import type { Note } from "@/lib/types";

function sourceBadge(source: string) {
  const map: Record<string, string> = {
    manual: "bg-acorn-200 text-acorn-800",
    granola: "bg-emerald-100 text-emerald-800",
  };
  return map[source] ?? "bg-slate-200 text-slate-700";
}

export default function NoteList({
  notes,
  selectedId,
  onSelect,
}: {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (notes.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-acorn-500">
        No notes yet. Create one or import from Granola.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-acorn-100">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            onClick={() => onSelect(note.id)}
            className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-acorn-100 ${
              selectedId === note.id ? "bg-acorn-100" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {note.title || "Untitled"}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sourceBadge(
                  note.source,
                )}`}
              >
                {note.source}
              </span>
            </div>
            <span className="truncate text-xs text-acorn-500">
              {note.content.slice(0, 80) || "Empty note"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
