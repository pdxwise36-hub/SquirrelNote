"use client";

import { useEffect, useRef, useState } from "react";
import type { Note, NoteUpdate } from "@/lib/types";
import MarkdownBody from "./MarkdownBody";
import ChecklistBody from "./ChecklistBody";
import TagEditor from "./TagEditor";
import AiPanel from "./AiPanel";

const COLORS = [
  null,
  "#e11d48",
  "#f59e0b",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
];

export default function NoteEditor({
  note,
  allTags,
  allFolders,
  onPatch,
  onDelete,
}: {
  note: Note;
  allTags: string[];
  allFolders: string[];
  onPatch: (patch: NoteUpdate) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editable = note.source === "manual";

  useEffect(() => {
    setTitle(note.title);
    setSaved(true);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced text saves (title / content).
  function debouncedPatch(patch: NoteUpdate) {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onPatch(patch);
      setSaved(true);
    }, 600);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      {/* header row */}
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          disabled={!editable}
          onChange={(e) => {
            setTitle(e.target.value);
            debouncedPatch({ title: e.target.value });
          }}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-bold outline-none disabled:opacity-80"
        />
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted">{saved ? "Saved" : "Saving…"}</span>
          <button
            onClick={() => onPatch({ pinned: !note.pinned })}
            className={`rounded-app px-2 py-1 text-sm ${
              note.pinned ? "text-accent" : "text-muted hover:bg-surface-2"
            }`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            ★
          </button>
          <button
            onClick={onDelete}
            className="rounded-app border px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      {/* meta controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-app border bg-surface px-3 py-2">
        {/* color */}
        <div className="flex items-center gap-1.5">
          {COLORS.map((c, i) => (
            <button
              key={i}
              onClick={() => onPatch({ color: c })}
              className={`h-5 w-5 rounded-full border transition ${
                note.color === c || (!note.color && c === null)
                  ? "ring-2 ring-offset-1 ring-offset-surface ring-fg"
                  : ""
              }`}
              style={{ background: c ?? "transparent" }}
              title={c ?? "No color"}
            >
              {c === null ? "∅" : ""}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        {/* folder */}
        <input
          list="folders"
          defaultValue={note.folder ?? ""}
          disabled={!editable}
          onBlur={(e) =>
            onPatch({ folder: e.target.value.trim() || null })
          }
          placeholder="📁 Folder"
          className="w-32 rounded-app border bg-bg px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <datalist id="folders">
          {allFolders.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>

        {/* tags */}
        {editable && (
          <TagEditor
            tags={note.tags ?? []}
            suggestions={allTags}
            onChange={(tags) => onPatch({ tags })}
          />
        )}
      </div>

      {!editable && (
        <p className="rounded-app bg-accent-soft px-3 py-2 text-xs">
          Imported from {note.source}. Content is read-only — use Ask Claude below.
        </p>
      )}

      {/* body */}
      {note.kind === "checklist" ? (
        <ChecklistBody
          items={note.items ?? []}
          editable={editable}
          onChange={(items) => onPatch({ items })}
        />
      ) : (
        <MarkdownBody
          content={note.content}
          editable={editable}
          onChange={(content) => debouncedPatch({ content })}
        />
      )}

      <AiPanel
        note={note}
        onSummary={(summary) => onPatch({ summary })}
      />
    </div>
  );
}
