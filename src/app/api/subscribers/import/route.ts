import { NextResponse } from "next/server";
import { fetchEmailsFromApi } from "@/lib/importSource";
import { importSubscribers } from "@/lib/subscribers";

export const runtime = "nodejs";

/** Pull emails from the external API (see src/lib/importSource.ts) into the store. */
export async function POST() {
  try {
    const emails = await fetchEmailsFromApi();
    const { added, skipped } = await importSubscribers(emails);
    return NextResponse.json({
      ok: true,
      fetched: emails.length,
      added,
      skipped,
      message: `Imported ${added} email(s)${skipped ? `, ${skipped} already in list` : ""}.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
