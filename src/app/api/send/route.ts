import { NextResponse } from "next/server";
import { z } from "zod";
import { announcementInputSchema, buildAnnouncement } from "@/lib/announcement";
import { sendTest, sendToRecipients } from "@/lib/send";

export const runtime = "nodejs";

const bodySchema = z.object({
  announcement: announcementInputSchema,
  mode: z.enum(["test", "send"]),
  // required for mode=test; treat empty string as "not provided"
  to: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().email().optional()),
  recipients: z.array(z.string().trim().email()).optional(), // required for mode=send
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { announcement: input, mode, to, recipients } = parsed.data;
  const announcement = buildAnnouncement(input);

  try {
    if (mode === "test") {
      if (!to) {
        return NextResponse.json({ error: "Enter a test email address." }, { status: 400 });
      }
      const { error } = await sendTest(announcement, to);
      if (error) return NextResponse.json({ error }, { status: 502 });
      return NextResponse.json({ ok: true, message: `Test sent to ${to}.` });
    }

    // mode === "send"
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Select at least one recipient." }, { status: 400 });
    }
    const result = await sendToRecipients(announcement, recipients);
    if (result.sent === 0) {
      return NextResponse.json(
        { error: `Nothing sent. ${result.errors.join("; ") || "No matching active subscribers."}` },
        { status: 502 },
      );
    }
    const failNote = result.failed ? `, ${result.failed} failed` : "";
    return NextResponse.json({ ok: true, message: `Sent to ${result.sent} recipient(s)${failNote}.` });
  } catch (err) {
    console.error("[send] error:", err);
    return NextResponse.json({ error: "Something went wrong sending." }, { status: 500 });
  }
}
