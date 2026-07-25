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
    <div className="space-y-4 rounded-lg border border-acorn-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-acorn-700">Ask Claude</h3>
        <button
          onClick={summarize}
          disabled={busy !== null}
          className="rounded-md bg-acorn-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-acorn-700 disabled:opacity-50"
        >
          {busy === "summarize" ? "Summarizing…" : "Summarize note"}
        </button>
      </div>

      {note.summary && (
        <div className="rounded-md bg-acorn-50 p-3 text-sm text-acorn-800">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-acorn-500">
            Summary
          </div>
          {note.summary}
        </div>
      )}

      <form onSubmit={ask} className="space-y-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this note…"
          className="w-full rounded-md border border-acorn-200 px-3 py-2 text-sm outline-none focus:border-acorn-400"
        />
        <button
          type="submit"
          disabled={busy !== null || !question.trim()}
          className="rounded-md border border-acorn-300 px-3 py-1.5 text-xs font-medium text-acorn-700 transition hover:bg-acorn-100 disabled:opacity-50"
        >
          {busy === "ask" ? "Thinking…" : "Ask"}
        </button>
      </form>

      {answer && (
        <div className="note-content rounded-md bg-white p-3 text-sm text-acorn-900 ring-1 ring-acorn-100">
          {answer}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
