-- SquirrelNote v2: checklists + organization + per-note customization.

alter table public.notes
  -- 'note' (rich text) | 'checklist'
  add column if not exists kind    text not null default 'note',
  add column if not exists pinned  boolean not null default false,
  -- optional hex color label, e.g. '#e11d48'
  add column if not exists color   text,
  add column if not exists tags    text[] not null default '{}',
  add column if not exists folder  text,
  -- checklist items: [{ "id": "...", "text": "...", "checked": false }]
  add column if not exists items   jsonb not null default '[]'::jsonb;

create index if not exists notes_folder_idx on public.notes (folder);
create index if not exists notes_pinned_idx on public.notes (pinned);
create index if not exists notes_tags_idx on public.notes using gin (tags);
