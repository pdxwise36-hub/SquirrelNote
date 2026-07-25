-- SquirrelNote initial schema
-- A single "notes" table that stores manually written notes as well as notes
-- imported from external integrations (Granola, and future sources).

create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default 'Untitled',
  content      text not null default '',
  -- where the note came from: 'manual' | 'granola' | future integrations
  source       text not null default 'manual',
  -- external id from the source system, used to de-duplicate imports
  source_id    text,
  -- AI-generated summary, cached so we don't re-call Claude every render
  summary      text,
  -- free-form structured data from integrations (attendees, urls, etc.)
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Prevent importing the same external note twice.
create unique index if not exists notes_source_unique
  on public.notes (source, source_id)
  where source_id is not null;

create index if not exists notes_created_at_idx
  on public.notes (created_at desc);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- Row Level Security is enabled; the app talks to the DB with the service-role
-- key from server-side API routes only, so no public policies are defined.
-- When you add end-user auth, add per-user policies here and switch the client
-- to the anon key.
alter table public.notes enable row level security;
