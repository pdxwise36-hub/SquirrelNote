"use client";

import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/types";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  );

  async function loadNotes() {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load notes");
      setNotes(data.notes);
      if (!selectedId && data.notes.length) setSelectedId(data.notes[0].id);
    } catch (e) {
      setBanner((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", content: "" }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotes((prev) => [data.note, ...prev]);
      setSelectedId(data.note.id);
    } else {
      setBanner(data.error);
    }
  }

  async function importGranola() {
    setImporting(true);
    setBanner(null);
    try {
      const res = await fetch("/api/granola/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 25 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setBanner(`Imported ${data.imported} note(s) from Granola.`);
      await loadNotes();
    } catch (e) {
      setBanner((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function applyPatch(patch: Partial<Note>) {
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)),
    );
  }

  async function deleteNote() {
    if (!selectedId) return;
    const res = await fetch(`/api/notes/${selectedId}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== selectedId));
      setSelectedId(null);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-acorn-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐿️</span>
          <h1 className="text-lg font-semibold text-acorn-800">SquirrelNote</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={importGranola}
            disabled={importing}
            className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import from Granola"}
          </button>
          <button
            onClick={createNote}
            className="rounded-md bg-acorn-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-acorn-700"
          >
            New note
          </button>
        </div>
      </header>

      {banner && (
        <div className="border-b border-acorn-200 bg-acorn-100 px-6 py-2 text-sm text-acorn-800">
          {banner}
          <button
            onClick={() => setBanner(null)}
            className="ml-3 text-acorn-500 underline"
          >
            dismiss
          </button>
        </div>
      )}

      <div className="grid flex-1 grid-cols-[320px_1fr] overflow-hidden">
        <aside className="overflow-y-auto border-r border-acorn-200 bg-white">
          {loading ? (
            <p className="px-4 py-6 text-sm text-acorn-500">Loading…</p>
          ) : (
            <NoteList
              notes={notes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </aside>

        <main className="overflow-y-auto p-6">
          {selected ? (
            <NoteEditor
              key={selected.id}
              note={selected}
              onChange={applyPatch}
              onDelete={deleteNote}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-acorn-400">
              Select a note, create one, or import from Granola to get started.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
