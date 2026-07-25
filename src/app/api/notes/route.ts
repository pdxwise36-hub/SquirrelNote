import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NewNote } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/notes — list all notes, newest first
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ notes: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

// POST /api/notes — create a note
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NewNote>;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notes")
      .insert({
        title: body.title?.trim() || "Untitled",
        content: body.content ?? "",
        source: body.source ?? "manual",
        source_id: body.source_id ?? null,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
