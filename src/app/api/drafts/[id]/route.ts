import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteDraft, getDraft, updateDraft } from "@/lib/drafts";
import { currentUserEmail } from "@/lib/session";

export const runtime = "nodejs";

const updateSchema = z.object({
  title: z.string().optional(),
  label: z.string().optional(),
  preview: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.string().optional(),
  changelogUrl: z.string().optional(),
  cta: z.string().optional(),
});

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await currentUserEmail();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  const draft = await getDraft(id, owner);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await currentUserEmail();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Bad id." }, { status: 400 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const draft = await updateDraft(id, parsed.data, owner);
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = await currentUserEmail();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  await deleteDraft(id, owner);
  return NextResponse.json({ ok: true });
}
