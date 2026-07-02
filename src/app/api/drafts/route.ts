import { NextResponse } from "next/server";
import { z } from "zod";
import { createDraft, listDrafts } from "@/lib/drafts";

export const runtime = "nodejs";

const draftSchema = z.object({
  title: z.string().default(""),
  label: z.string().default(""),
  preview: z.string().default(""),
  summary: z.string().default(""),
  highlights: z.string().default(""),
  changelogUrl: z.string().default(""),
  cta: z.string().default(""),
});

export async function GET() {
  return NextResponse.json({ drafts: await listDrafts() });
}

export async function POST(req: Request) {
  const parsed = draftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  }
  const draft = await createDraft(parsed.data);
  return NextResponse.json({ draft });
}
