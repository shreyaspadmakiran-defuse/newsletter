import { NextResponse } from "next/server";
import { buildAnnouncement, previewInputSchema } from "@/lib/announcement";
import { renderAnnouncementHtml } from "@/lib/renderEmail";

// React Email render needs the Node runtime.
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Lenient parse so the preview renders whatever's typed so far, from field one.
  const parsed = previewInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const html = await renderAnnouncementHtml(buildAnnouncement(parsed.data));
  return NextResponse.json({ html });
}
