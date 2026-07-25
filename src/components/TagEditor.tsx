"use client";

import { useState } from "react";

export default function TagEditor({
  tags,
  suggestions,
  onChange,
}: {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add(raw: string) {
    const t = raw.trim().replace(/^#/, "").toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }

  const available = suggestions.filter(
    (s) => !tags.includes(s) && s.includes(input.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs"
        >
          #{t}
          <button
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="text-muted hover:text-fg"
          >
            ✕
          </button>
        </span>
      ))}
      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder="+ tag"
          className="w-20 rounded-full border bg-bg px-2 py-0.5 text-xs outline-none focus:border-accent"
        />
        {input && available.length > 0 && (
          <div className="absolute z-10 mt-1 w-32 rounded-app border bg-surface p-1 shadow">
            {available.slice(0, 5).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-surface-2"
              >
                #{s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
