# 🐿️ SquirrelNote

A note-taking web app connected to a couple of different apps:

- **Supabase** — Postgres database that stores every note.
- **Claude** — summarize any note, ask questions about it, and turn freeform text into a checklist (via the Anthropic API).
- **Granola** — import your meeting notes as first-class notes.

Built with Next.js (App Router) + TypeScript + Tailwind, and designed to deploy to Vercel. The integration layer is deliberately modular so you can add more sources (Gmail, Notion, …) later without reworking the core.

### Features

- **Two note types** — rich-text notes (Markdown toolbar + live preview) and **checklists** (check off items, drag to reorder, progress bar).
- **Text → checklist** — paste text and either split it line-by-line or let **Claude extract the action items**.
- **Organization** — folders, tags, pinning, per-note color labels, search, and sort.
- **Full customization** — light/dark/system theme, accent color (presets + custom), font, density, and list/grid view. Preferences persist per browser (see `src/lib/prefs.tsx`).

---

## Architecture

```
Browser (React)
   │  fetch()
   ▼
Next.js API routes  ──────────────┐
   /api/notes         CRUD        │  service-role key (server only)
   /api/notes/[id]    update/del  ├─────────►  Supabase (Postgres)
   /api/ai            Claude      │
   /api/granola/import Granola    │
                                  │  ANTHROPIC_API_KEY  ─►  Claude
                                  │  GRANOLA_API_TOKEN  ─►  Granola API
```

- All secrets stay server-side. The browser never sees the Supabase service-role key, the Anthropic key, or the Granola token — it only talks to `/api/*` routes.
- `notes` is a single table that holds both hand-written notes (`source = 'manual'`) and imported ones (`source = 'granola'`), de-duplicated on `(source, source_id)`.

Key files:

| Path | What it does |
|------|--------------|
| `supabase/migrations/0001_init.sql` | Database schema |
| `src/lib/supabase/server.ts` | Server-only Supabase client |
| `src/lib/claude.ts` | Claude summarize / ask helpers |
| `src/lib/integrations/granola.ts` | Granola fetch + mapping (add new sources alongside this) |
| `src/app/api/*` | API routes |
| `src/components/*` | UI (list, editor, AI panel) |

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment variables

The Supabase project is already provisioned. Copy `.env.example` to `.env.local` (a pre-filled `.env.local` is already present) and fill in the blanks:

| Variable | Where to get it |
|----------|-----------------|
| `SUPABASE_URL` | Pre-filled: `https://dmsftllmpuwgcbdfmuso.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → **Project Settings → API → `service_role` (secret)**. [Open settings](https://supabase.com/dashboard/project/dmsftllmpuwgcbdfmuso/settings/api) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) → API Keys |
| `ANTHROPIC_MODEL` | Optional, defaults to `claude-opus-4-8` |
| `GRANOLA_API_TOKEN` | See the **Granola** section below (optional) |

> The `service_role` key bypasses Row Level Security and is only ever used in server-side API routes. Never expose it to the browser or commit it.

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Using it

- **New note** — create a blank note and start typing. It autosaves.
- **Summarize note** — Claude writes a 2–4 sentence summary, cached on the note.
- **Ask Claude** — ask a question grounded in the selected note's content.
- **Import from Granola** — pulls your recent Granola meetings in as read-only notes (requires `GRANOLA_API_TOKEN`).

---

## Granola

SquirrelNote talks to Granola's HTTP API with a personal bearer token.

Granola does not (yet) publish an official public API, so the app reads the same
`v2/get-documents` endpoint the desktop app uses. To get a token, retrieve it
from your local Granola credentials:

- **macOS:** `~/Library/Application Support/Granola/supabase.json` → the
  `access_token` inside `cognito_tokens`.

Set that value as `GRANOLA_API_TOKEN`. The mapping from a Granola document to a
SquirrelNote note lives entirely in `src/lib/integrations/granola.ts` — if
Granola changes its response shape, that's the only file to touch.

> If the endpoint or token format changes, `importGranolaNotes()` is where to
> adjust. Imports are idempotent (upsert on `source_id`), so re-running is safe.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, and optionally `GRANOLA_API_TOKEN`) in the Vercel project settings.
4. Deploy. The API routes run as serverless functions; `/api/ai` and `/api/granola/import` are configured with a 60s max duration for slower Claude/Granola calls.

---

## Adding more integrations later

Each integration is a module under `src/lib/integrations/` that returns
`NewNote[]`, plus a small API route that upserts them. To add Gmail, for
example: create `src/lib/integrations/gmail.ts` exporting an
`importGmailNotes()` that maps emails to `NewNote`, add
`src/app/api/gmail/import/route.ts` mirroring the Granola route, and add a button
in `src/components/App.tsx`. The `notes` table already supports arbitrary
sources via the `source` / `source_id` / `metadata` columns.
