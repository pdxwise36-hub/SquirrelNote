"use client";

import { useState } from "react";
import type { Note } from "@/lib/types";

export default function AiPanel({
  note,
  onSummary,
}: {
  note: Note;
  onSummary: (summary: string) => void;
}) {
  const [busy, setBusy] = useState<"summarize" | "ask" | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function summarize() {
    setBusy("summarize");
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize", noteId: note.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize");
      onSummary(data.summary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy("ask");
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", noteId: note.id, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to answer");
      setAnswer(data.answer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-app border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">✨ Ask Claude</h3>
        <button
          onClick={summarize}
          disabled={busy !== null}
          className="rounded-app bg-accent px-3 py-1.5 text-xs font-medium text-accent-contrast disabled:opacity-50"
        >
          {busy === "summarize" ? "Summarizing…" : "Summarize"}
        </button>
      </div>

      {note.summary && (
        <div className="rounded-app bg-accent-soft p-3 text-sm">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Summary
          </div>
          {note.summary}
        </div>
      )}

      <form onSubmit={ask} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this note…"
          className="flex-1 rounded-app border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy !== null || !question.trim()}
          className="rounded-app border px-3 py-2 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          {busy === "ask" ? "…" : "Ask"}
        </button>
      </form>

      {answer && (
        <div className="note-content rounded-app bg-bg p-3 text-sm ring-1 ring-border">
          {answer}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
