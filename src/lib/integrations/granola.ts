import type { NewNote } from "@/lib/types";

/**
 * Granola integration.
 *
 * Granola exposes an HTTP API that the desktop app uses. You authenticate with
 * a personal bearer token (see the README for how to retrieve it) set as
 * GRANOLA_API_TOKEN. This module fetches your meeting documents and maps them
 * into SquirrelNote's `NewNote` shape so they can be stored alongside manual
 * notes.
 *
 * The mapping is deliberately isolated here: if Granola changes its response
 * shape, or you want to add another meeting-notes source later, this is the
 * only file that needs to change.
 */

const GRANOLA_API_BASE =
  process.env.GRANOLA_API_BASE || "https://api.granola.ai";

/** Raw document shape returned by Granola's get-documents endpoint. */
interface GranolaDocument {
  id: string;
  title?: string | null;
  created_at?: string | null;
  notes_markdown?: string | null;
  notes_plain?: string | null;
  // Granola includes richer structured data; we keep whatever is present.
  [key: string]: unknown;
}

interface GranolaDocumentsResponse {
  docs?: GranolaDocument[];
  documents?: GranolaDocument[];
}

export class GranolaNotConfiguredError extends Error {
  constructor() {
    super(
      "Granola is not configured. Set GRANOLA_API_TOKEN in your environment.",
    );
    this.name = "GranolaNotConfiguredError";
  }
}

function token(): string {
  const t = process.env.GRANOLA_API_TOKEN;
  if (!t) throw new GranolaNotConfiguredError();
  return t;
}

/** Fetch the most recent meeting documents from Granola. */
export async function fetchGranolaDocuments(
  limit = 25,
): Promise<GranolaDocument[]> {
  const res = await fetch(`${GRANOLA_API_BASE}/v2/get-documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit, offset: 0 }),
    // never cache credentials-bearing responses
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Granola API returned ${res.status} ${res.statusText}. ${body.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as GranolaDocumentsResponse;
  return data.docs ?? data.documents ?? [];
}

/** Convert a Granola document into a SquirrelNote note payload. */
export function granolaDocToNote(doc: GranolaDocument): NewNote {
  const content =
    (doc.notes_markdown && doc.notes_markdown.trim()) ||
    (doc.notes_plain && doc.notes_plain.trim()) ||
    "";

  const { notes_markdown, notes_plain, title, id, ...rest } = doc;

  return {
    title: (title && title.trim()) || "Untitled meeting",
    content,
    source: "granola",
    source_id: id,
    metadata: {
      ...rest,
      imported_at: new Date().toISOString(),
    },
  };
}

/** Fetch and map Granola documents ready for insertion. */
export async function importGranolaNotes(limit = 25): Promise<NewNote[]> {
  const docs = await fetchGranolaDocuments(limit);
  return docs.map(granolaDocToNote).filter((n) => (n.content ?? "").length > 0);
}
