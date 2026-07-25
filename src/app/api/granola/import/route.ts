import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  importGranolaNotes,
  GranolaNotConfiguredError,
} from "@/lib/integrations/granola";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/granola/import — pull recent Granola meetings into SquirrelNote.
// Uses an upsert on (source, source_id) so re-running is idempotent.
export async function POST(req: Request) {
  try {
    const { limit } = (await req
      .json()
      .catch(() => ({}))) as { limit?: number };

    const notes = await importGranolaNotes(limit ?? 25);

    if (notes.length === 0) {
      return NextResponse.json({ imported: 0, notes: [] });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notes")
      .upsert(
        notes.map((n) => ({
          title: n.title,
          content: n.content,
          source: n.source,
          source_id: n.source_id,
          metadata: n.metadata ?? {},
        })),
        { onConflict: "source,source_id", ignoreDuplicates: false },
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ imported: data?.length ?? 0, notes: data });
  } catch (err) {
    if (err instanceof GranolaNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
