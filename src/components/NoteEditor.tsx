"use client";

import { useEffect, useRef, useState } from "react";
import type { Note } from "@/lib/types";
import AiPanel from "./AiPanel";

export default function NoteEditor({
  note,
  onChange,
  onDelete,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when a different note is selected.
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setSaved(true);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave.
  function scheduleSave(next: { title?: string; content?: string }) {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.note);
        setSaved(true);
      }
    }, 700);
  }

  const editable = note.source === "manual";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          disabled={!editable}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value, content });
          }}
          className="w-full bg-transparent text-2xl font-semibold outline-none disabled:opacity-70"
        />
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-acorn-400">
            {saved ? "Saved" : "Saving…"}
          </span>
          <button
            onClick={onDelete}
            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {!editable && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Imported from {note.source}. Content is read-only; use Ask Claude below.
        </p>
      )}

      <textarea
        value={content}
        disabled={!editable}
        onChange={(e) => {
          setContent(e.target.value);
          scheduleSave({ title, content: e.target.value });
        }}
        placeholder="Start writing…"
        className="note-content min-h-[240px] flex-1 resize-none rounded-lg border border-acorn-200 bg-white p-4 text-sm leading-relaxed outline-none focus:border-acorn-400 disabled:bg-acorn-50/50"
      />

      <AiPanel
        note={{ ...note, title, content }}
        onSummary={(summary) => onChange({ summary })}
      />
    </div>
  );
}
