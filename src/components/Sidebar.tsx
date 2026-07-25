"use client";

import type { Filter } from "./Workspace";

export default function Sidebar({
  folders,
  tags,
  filter,
  onFilter,
  onNew,
  onImportGranola,
  importing,
  onOpenSettings,
}: {
  folders: string[];
  tags: string[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  onNew: (kind: "note" | "checklist") => void;
  onImportGranola: () => void;
  importing: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-surface-2">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <span className="text-xl">🐿️</span>
        <span className="font-semibold">SquirrelNote</span>
      </div>

      <div className="flex flex-col gap-1.5 px-3">
        <button
          onClick={() => onNew("note")}
          className="rounded-app bg-accent px-3 py-2 text-sm font-medium text-accent-contrast transition hover:opacity-90"
        >
          + New note
        </button>
        <button
          onClick={() => onNew("checklist")}
          className="rounded-app border bg-surface px-3 py-2 text-sm font-medium transition hover:bg-surface-2"
        >
          ✓ New checklist
        </button>
      </div>

      <nav className="scroll-thin mt-4 flex-1 overflow-y-auto px-2">
        <SectionButton
          label="All notes"
          active={!filter.folder && !filter.tag}
          onClick={() => onFilter({ ...filter, folder: null, tag: null })}
        />

        {folders.length > 0 && (
          <div className="mt-4">
            <Heading>Folders</Heading>
            {folders.map((f) => (
              <SectionButton
                key={f}
                label={`📁 ${f}`}
                active={filter.folder === f}
                onClick={() =>
                  onFilter({ ...filter, folder: f, tag: null })
                }
              />
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4">
            <Heading>Tags</Heading>
            <div className="flex flex-wrap gap-1.5 px-2 py-1">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    onFilter({
                      ...filter,
                      tag: filter.tag === t ? null : t,
                      folder: null,
                    })
                  }
                  className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                    filter.tag === t
                      ? "bg-accent text-accent-contrast"
                      : "bg-surface text-muted hover:bg-surface-2"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="flex flex-col gap-1.5 border-t p-3">
        <button
          onClick={onImportGranola}
          disabled={importing}
          className="rounded-app border bg-surface px-3 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-50"
        >
          {importing ? "Importing…" : "↓ Import from Granola"}
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-app px-3 py-2 text-left text-sm text-muted transition hover:bg-surface"
        >
          ⚙ Customize
        </button>
      </div>
    </aside>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}

function SectionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full truncate rounded-app px-2 py-1.5 text-left text-sm transition ${
        active ? "bg-accent-soft font-medium text-fg" : "text-muted hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
