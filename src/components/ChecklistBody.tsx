"use client";

import { useRef, useState } from "react";
import type { ChecklistItem } from "@/lib/types";

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export default function ChecklistBody({
  items,
  editable,
  onChange,
}: {
  items: ChecklistItem[];
  editable: boolean;
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [newText, setNewText] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const done = items.filter((i) => i.checked).length;

  function toggle(id: string) {
    onChange(
      items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  }

  function edit(id: string, text: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function addOne() {
    const t = newText.trim();
    if (!t) return;
    onChange([...items, { id: uid(), text: t, checked: false }]);
    setNewText("");
  }

  function addFromLines() {
    const lines = bulk
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*\[\]x\s]+/i, "").trim())
      .filter(Boolean);
    if (lines.length) {
      onChange([
        ...items,
        ...lines.map((text) => ({ id: uid(), text, checked: false })),
      ]);
    }
    setBulk("");
    setShowBulk(false);
  }

  async function addFromAi() {
    if (!bulk.trim()) return;
    setAiBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_checklist", text: bulk }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract");
      const newItems = (data.items as string[]).map((text) => ({
        id: uid(),
        text,
        checked: false,
      }));
      onChange([...items, ...newItems]);
      setBulk("");
      setShowBulk(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  }

  function onDrop(target: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* progress */}
      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(done / items.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted">
            {done}/{items.length}
          </span>
        </div>
      )}

      {/* items */}
      <ul className="flex flex-col gap-1">
        {items.map((item, idx) => (
          <li
            key={item.id}
            draggable={editable}
            onDragStart={() => (dragIndex.current = idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(idx)}
            className="group flex items-center gap-2 rounded-app px-2 py-1.5 hover:bg-surface-2"
          >
            {editable && (
              <span className="cursor-grab select-none text-muted opacity-0 group-hover:opacity-100">
                ⠿
              </span>
            )}
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggle(item.id)}
              className="h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <input
              value={item.text}
              disabled={!editable}
              onChange={(e) => edit(item.id, e.target.value)}
              className={`flex-1 bg-transparent text-sm outline-none ${
                item.checked ? "text-muted line-through" : ""
              }`}
            />
            {editable && (
              <button
                onClick={() => remove(item.id)}
                className="text-muted opacity-0 hover:text-fg group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {editable && (
        <>
          {/* quick add */}
          <div className="flex items-center gap-2">
            <span className="text-muted">+</span>
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addOne()}
              placeholder="Add an item…"
              className="flex-1 border-b bg-transparent py-1 text-sm outline-none focus:border-accent"
            />
          </div>

          {/* bulk / AI */}
          {!showBulk ? (
            <button
              onClick={() => setShowBulk(true)}
              className="self-start text-xs text-accent hover:underline"
            >
              Add from text…
            </button>
          ) : (
            <div className="rounded-app border bg-surface p-3">
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder="Paste or type text. Each line can become an item, or let Claude pull out the tasks."
                className="note-content min-h-[90px] w-full resize-none rounded-app border bg-bg p-2 text-sm outline-none focus:border-accent"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={addFromLines}
                  className="rounded-app border px-3 py-1.5 text-xs hover:bg-surface-2"
                >
                  Split by line
                </button>
                <button
                  onClick={addFromAi}
                  disabled={aiBusy}
                  className="rounded-app bg-accent px-3 py-1.5 text-xs font-medium text-accent-contrast disabled:opacity-50"
                >
                  {aiBusy ? "Extracting…" : "Extract with Claude"}
                </button>
                <button
                  onClick={() => {
                    setShowBulk(false);
                    setBulk("");
                  }}
                  className="text-xs text-muted hover:underline"
                >
                  cancel
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
