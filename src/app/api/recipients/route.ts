import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addRecipients,
  listRecipientsDetailed,
  parseEmails,
  removeRecipient,
  removeRecipients,
} from "@/lib/recipients";

export const runtime = "nodejs";

export async function GET() {
  const details = await listRecipientsDetailed();
  // `recipients` (plain email strings) kept for the compose page; `details` adds org names.
  return NextResponse.json({ recipients: details.map((d) => d.email), details });
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
  const body = (await req.json().catch(() => null)) as { email?: string; emails?: string[] } | null;
  if (Array.isArray(body?.emails)) {
    const parsed = z.array(z.string().trim().email()).safeParse(body.emails);
    if (!parsed.success) return NextResponse.json({ error: "Invalid emails." }, { status: 400 });
    const removed = await removeRecipients(parsed.data);
    return NextResponse.json({ ok: true, removed });
  }
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  await removeRecipient(parsed.data.email);
  return NextResponse.json({ ok: true, removed: 1 });
}
