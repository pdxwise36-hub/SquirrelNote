import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NoteUpdate } from "@/lib/types";

export const dynamic = "force-dynamic";

// PATCH /api/notes/:id — update a note
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await req.json()) as NoteUpdate;
    const supabase = getSupabaseAdmin();

    const update: NoteUpdate = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.content !== undefined) update.content = body.content;
    if (body.summary !== undefined) update.summary = body.summary;
    if (body.metadata !== undefined) update.metadata = body.metadata;

    const { data, error } = await supabase
      .from("notes")
      .update(update)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/:id — delete a note
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
