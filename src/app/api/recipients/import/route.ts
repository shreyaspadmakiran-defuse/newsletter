import { NextResponse } from "next/server";
import { fetchEmailsFromApi } from "@/lib/importSource";
import { addRecipients } from "@/lib/recipients";

export const runtime = "nodejs";

/**
 * Pull emails from the external API (see src/lib/importSource.ts) and add them
 * to the saved recipient list. The stub throws until you wire fetchEmailsFromApi().
 */
export async function POST() {
  try {
    const contacts = await fetchEmailsFromApi();
    const { added, skipped } = await addRecipients(contacts.map((c) => c.email));
    return NextResponse.json({
      ok: true,
      added,
      skipped,
      message: `Imported ${added} email(s)${skipped ? `, ${skipped} already in list` : ""}.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
