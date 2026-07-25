"use client";

import { useEffect, useMemo, useState } from "react";
import type { Note, NoteUpdate } from "@/lib/types";
import { usePrefs } from "@/lib/prefs";
import Sidebar from "./Sidebar";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import SettingsPanel from "./SettingsPanel";

export interface Filter {
  folder: string | null; // null = all
  tag: string | null;
  query: string;
}

export default function Workspace() {
  const { prefs, setPref } = usePrefs();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({
    folder: null,
    tag: null,
    query: "",
  });

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

  // ---- derived lists ----
  const folders = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.folder && set.add(n.folder));
    return [...set].sort();
  }, [notes]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const visible = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    let list = notes.filter((n) => {
      if (filter.folder && n.folder !== filter.folder) return false;
      if (filter.tag && !n.tags?.includes(filter.tag)) return false;
      if (q) {
        const hay = (
          n.title +
          " " +
          n.content +
          " " +
          (n.items ?? []).map((i) => i.text).join(" ") +
          " " +
          (n.tags ?? []).join(" ")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sort = prefs.sort;
    list = [...list].sort((a, b) => {
      // pinned always first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "title") return a.title.localeCompare(b.title);
      const key = sort === "created" ? "created_at" : "updated_at";
      return b[key].localeCompare(a[key]);
    });
    return list;
  }, [notes, filter, prefs.sort]);

  // ---- mutations ----
  async function createNote(kind: "note" | "checklist") {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: kind === "checklist" ? "New checklist" : "Untitled",
        kind,
        folder: filter.folder,
        content: "",
        items: [],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotes((prev) => [data.note, ...prev]);
      setSelectedId(data.note.id);
    } else {
      setBanner(data.error);
    }
  }

  async function patchNote(id: string, patch: NoteUpdate) {
    // optimistic
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    );
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)));
    }
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedId === id) setSelectedId(null);
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

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-app text-fg">
      {!prefs.sidebarCollapsed && (
        <Sidebar
          folders={folders}
          tags={tags}
          filter={filter}
          onFilter={setFilter}
          onNew={createNote}
          onImportGranola={importGranola}
          importing={importing}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-surface px-4 py-2.5">
          <button
            onClick={() => setPref("sidebarCollapsed", !prefs.sidebarCollapsed)}
            className="rounded-app p-1.5 text-muted hover:bg-surface-2"
            title="Toggle sidebar"
          >
            ☰
          </button>
          <input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search notes…"
            className="w-full max-w-md rounded-app border bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <div className="ml-auto flex items-center gap-1.5">
            <select
              value={prefs.sort}
              onChange={(e) => setPref("sort", e.target.value as never)}
              className="rounded-app border bg-surface px-2 py-1.5 text-xs text-muted outline-none"
              title="Sort"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="title">Title A–Z</option>
            </select>
            <button
              onClick={() =>
                setPref("view", prefs.view === "list" ? "grid" : "list")
              }
              className="rounded-app border p-1.5 text-muted hover:bg-surface-2"
              title="Toggle list/grid"
            >
              {prefs.view === "list" ? "▦" : "☰"}
            </button>
          </div>
        </header>

        {banner && (
          <div className="flex items-center gap-3 border-b bg-accent-soft px-4 py-2 text-sm">
            <span>{banner}</span>
            <button
              onClick={() => setBanner(null)}
              className="text-muted underline"
            >
              dismiss
            </button>
          </div>
        )}

        <div className="grid flex-1 grid-cols-[minmax(280px,340px)_1fr] overflow-hidden">
          <div className="scroll-thin overflow-y-auto border-r bg-surface">
            {loading ? (
              <p className="px-4 py-6 text-sm text-muted">Loading…</p>
            ) : (
              <NoteList
                notes={visible}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onTogglePin={(n) => patchNote(n.id, { pinned: !n.pinned })}
              />
            )}
          </div>

          <main className="scroll-thin overflow-y-auto p-6">
            {selected ? (
              <NoteEditor
                key={selected.id}
                note={selected}
                allTags={tags}
                allFolders={folders}
                onPatch={(patch) => patchNote(selected.id, patch)}
                onDelete={() => deleteNote(selected.id)}
              />
            ) : (
              <EmptyState onNew={createNote} />
            )}
          </main>
        </div>
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function EmptyState({
  onNew,
}: {
  onNew: (kind: "note" | "checklist") => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted">
      <div className="text-5xl">🐿️</div>
      <p>Pick a note, or start something new.</p>
      <div className="flex gap-2">
        <button
          onClick={() => onNew("note")}
          className="rounded-app bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
        >
          New note
        </button>
        <button
          onClick={() => onNew("checklist")}
          className="rounded-app border px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          New checklist
        </button>
      </div>
    </div>
  );
}
