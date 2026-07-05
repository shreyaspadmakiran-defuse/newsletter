import { NextResponse } from "next/server";
import { z } from "zod";
import { createDraft, listDrafts } from "@/lib/drafts";
import { currentUserEmail } from "@/lib/session";

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
  const owner = await currentUserEmail();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ drafts: await listDrafts(owner) });
}

export async function POST(req: Request) {
  const owner = await currentUserEmail();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = draftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  }
  const draft = await createDraft(parsed.data, owner);
  return NextResponse.json({ draft });
}
