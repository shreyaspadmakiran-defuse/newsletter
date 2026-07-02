import { NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber, importSubscribers, listSubscribers, removeSubscriber } from "@/lib/subscribers";

export const runtime = "nodejs";

// These endpoints read and modify the subscriber list, with no auth. Fine for
// local dev. Put the admin area (/compose and these routes) behind auth before
// deploying anywhere public.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => EMAIL_RE.test(t));
  return [...new Set(tokens)];
}

export async function GET() {
  return NextResponse.json({ subscribers: await listSubscribers() });
}

/**
 * Add one or many.
 *   { email: "a@b.com" }                  → single (also re-activates if unsubscribed)
 *   { text: "a@b.com, c@d.com\n..." }      → bulk paste (any separators)
 *   { emails: ["a@b.com", "c@d.com"] }     → bulk array
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; text?: string; emails?: string[] }
    | null;

  // Single
  if (body?.email && !body.text && !body.emails) {
    const parsed = z.object({ email: z.string().trim().email() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    const sub = await addSubscriber(parsed.data.email);
    return NextResponse.json({ subscriber: sub, added: 1, skipped: 0 });
  }

  // Bulk
  const text = body?.text ?? (Array.isArray(body?.emails) ? body!.emails!.join("\n") : "");
  const emails = parseEmails(text);
  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid emails found." }, { status: 400 });
  }
  const { added, skipped } = await importSubscribers(emails.map((email) => ({ email })));
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  await removeSubscriber(parsed.data.email);
  return NextResponse.json({ ok: true });
}
