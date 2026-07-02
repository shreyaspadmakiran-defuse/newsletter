import { NextResponse } from "next/server";
import { z } from "zod";
import { addRecipients, listRecipients, parseEmails, removeRecipient } from "@/lib/recipients";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ recipients: await listRecipients() });
}

/** Add emails: { text: "a@b.com, c@d.com" } or { emails: [...] }. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: string; emails?: string[] } | null;
  const emails = body?.text ? parseEmails(body.text) : Array.isArray(body?.emails) ? body!.emails! : [];
  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid emails found." }, { status: 400 });
  }
  const { added, skipped } = await addRecipients(emails);
  return NextResponse.json({
    added,
    skipped,
    message: `Added ${added} email(s)${skipped ? `, ${skipped} already in list` : ""}.`,
  });
}

export async function DELETE(req: Request) {
  const parsed = z
    .object({ email: z.string().trim().email() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  await removeRecipient(parsed.data.email);
  return NextResponse.json({ ok: true });
}
