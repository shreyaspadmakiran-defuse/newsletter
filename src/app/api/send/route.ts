import { NextResponse } from "next/server";
import { z } from "zod";
import { announcementInputSchema, buildAnnouncement } from "@/lib/announcement";
import { createDraft, markSent } from "@/lib/drafts";
import { sendTest, sendToRecipients } from "@/lib/send";

export const runtime = "nodejs";

const bodySchema = z.object({
  announcement: announcementInputSchema,
  mode: z.enum(["test", "send"]),
  to: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().email().optional()),
  recipients: z.array(z.string().trim().email()).optional(),
  draftId: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { announcement: input, mode, to, recipients, draftId } = parsed.data;
  const announcement = buildAnnouncement(input);

  try {
    if (mode === "test") {
      if (!to) return NextResponse.json({ error: "Enter a test email address." }, { status: 400 });
      const { error } = await sendTest(announcement, to);
      if (error) return NextResponse.json({ error }, { status: 502 });
      return NextResponse.json({ ok: true, message: `Test sent to ${to}.` });
    }

    // mode === "send"
    const list = [...new Set((recipients ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (list.length === 0) {
      return NextResponse.json({ error: "Select at least one recipient." }, { status: 400 });
    }

    // Record against a draft: reuse the loaded one, or auto-save so it shows in history.
    let id = draftId ?? null;
    if (id === null) {
      const created = await createDraft({
        title: input.title,
        label: input.label ?? "",
        preview: input.preview,
        summary: input.summary,
        highlights: input.highlights ?? "",
        changelogUrl: input.changelogUrl,
        cta: input.cta ?? "",
      });
      id = created.id;
    }

    const result = await sendToRecipients(announcement, list);
    if (result.sent === 0) {
      return NextResponse.json(
        { error: `Nothing sent. ${result.errors.join("; ") || "No recipients."}`, draftId: id },
        { status: 502 },
      );
    }
    await markSent(id, list);

    const failNote = result.failed ? `, ${result.failed} failed` : "";
    return NextResponse.json({
      ok: true,
      draftId: id,
      message: `Sent to ${result.sent} recipient(s)${failNote}.`,
    });
  } catch (err) {
    console.error("[send] error:", err);
    return NextResponse.json({ error: "Something went wrong sending." }, { status: 500 });
  }
}
