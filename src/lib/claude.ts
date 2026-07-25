import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-opus-4-8";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Claude is not configured. Set ANTHROPIC_API_KEY in your environment.",
    );
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

function model(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

function firstText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Produce a tight summary of a note's contents. */
export async function summarizeNote(input: {
  title: string;
  content: string;
}): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: model(),
    max_tokens: 1024,
    system:
      "You are a concise note-summarizing assistant. Summarize the note in 2-4 sentences, " +
      "capturing key points, decisions, and action items. Return plain text only — no preamble.",
    messages: [
      {
        role: "user",
        content: `Title: ${input.title}\n\n${input.content}`,
      },
    ],
  });
  return firstText(message);
}

/** Answer a question grounded in a single note's contents. */
export async function askAboutNote(input: {
  title: string;
  content: string;
  question: string;
}): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: model(),
    max_tokens: 2048,
    system:
      "You answer questions about the note provided by the user. Ground every answer in the " +
      "note's content. If the note doesn't contain the answer, say so plainly.",
    messages: [
      {
        role: "user",
        content: `Note title: ${input.title}\n\nNote content:\n${input.content}\n\n---\nQuestion: ${input.question}`,
      },
    ],
  });
  return firstText(message);
}
