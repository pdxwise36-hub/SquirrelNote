import { NextResponse } from "next/server";
import {
  summarizeNote,
  askAboutNote,
  extractChecklist,
} from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
// Claude calls can take a while; give the route room on Vercel.
export const maxDuration = 60;

type Body =
  | { action: "summarize"; noteId: string }
  | { action: "ask"; noteId: string; question: string }
  | { action: "extract_checklist"; text: string };

// POST /api/ai — run a Claude action.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // Text-only action: no stored note required.
    if (body.action === "extract_checklist") {
      if (!body.text?.trim()) {
        return NextResponse.json(
          { error: "Text is required" },
          { status: 400 },
        );
      }
      const items = await extractChecklist(body.text);
      return NextResponse.json({ items });
    }

    const supabase = getSupabaseAdmin();
    const { data: note, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", body.noteId)
      .single();

    if (error) throw error;
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // For checklists, summarize/answer over the item text.
    const contentForAi =
      note.kind === "checklist"
        ? (note.items ?? [])
            .map(
              (i: { checked: boolean; text: string }) =>
                `[${i.checked ? "x" : " "}] ${i.text}`,
            )
            .join("\n")
        : note.content;

    if (body.action === "summarize") {
      const summary = await summarizeNote({
        title: note.title,
        content: contentForAi,
      });
      await supabase.from("notes").update({ summary }).eq("id", note.id);
      return NextResponse.json({ summary });
    }

    if (body.action === "ask") {
      if (!body.question?.trim()) {
        return NextResponse.json(
          { error: "A question is required" },
          { status: 400 },
        );
      }
      const answer = await askAboutNote({
        title: note.title,
        content: contentForAi,
        question: body.question,
      });
      return NextResponse.json({ answer });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
