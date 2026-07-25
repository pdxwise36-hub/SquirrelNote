"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownBody({
  content,
  editable,
  onChange,
}: {
  content: string;
  editable: boolean;
  onChange: (content: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(!editable);

  // Wrap or prefix the current selection with markdown syntax.
  function surround(before: string, after = before) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || "text";
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + selected.length;
    });
  }

  function prefixLine(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + prefix.length;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 rounded-app border bg-surface p-1">
          <ToolBtn onClick={() => prefixLine("# ")} label="H1" />
          <ToolBtn onClick={() => prefixLine("## ")} label="H2" />
          <ToolBtn onClick={() => surround("**")} label="B" bold />
          <ToolBtn onClick={() => surround("*")} label="i" italic />
          <ToolBtn onClick={() => surround("`")} label="‹›" />
          <ToolBtn onClick={() => prefixLine("- ")} label="• List" />
          <div className="ml-auto">
            <ToolBtn
              onClick={() => setPreview((p) => !p)}
              label={preview ? "Edit" : "Preview"}
              active={preview}
            />
          </div>
        </div>
      )}

      {preview ? (
        <div
          className="md note-content min-h-[240px] rounded-app border bg-surface p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "*Nothing here yet.*") }}
        />
      ) : (
        <textarea
          ref={ref}
          value={content}
          disabled={!editable}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing… Markdown supported (#, **bold**, - lists)."
          className="note-content min-h-[240px] flex-1 resize-none rounded-app border bg-surface p-4 text-sm leading-relaxed outline-none focus:border-accent"
        />
      )}
    </div>
  );
}

function ToolBtn({
  onClick,
  label,
  bold,
  italic,
  active,
}: {
  onClick: () => void;
  label: string;
  bold?: boolean;
  italic?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs transition hover:bg-surface-2 ${
        active ? "bg-accent-soft" : ""
      } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}
