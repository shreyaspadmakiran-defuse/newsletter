import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { recipients } from "../db/schema";

export type Recipient = { email: string; orgName: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse free text (newlines, commas, spaces) into unique, valid, lowercased emails. */
export function parseEmails(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => EMAIL_RE.test(t)),
    ),
  ];
}

export async function listRecipients(): Promise<string[]> {
  const rows = await db().select({ email: recipients.email }).from(recipients).orderBy(asc(recipients.email));
  return rows.map((r) => r.email);
}

/** Same list, with the org name (null for manual adds). */
export async function listRecipientsDetailed(): Promise<Recipient[]> {
  return db()
    .select({ email: recipients.email, orgName: recipients.orgName })
    .from(recipients)
    .orderBy(asc(recipients.email));
}

/**
 * Add emails with an org name, updating the org name on rows that already exist.
 * Used by the CSV/API importer so org names backfill onto prior imports.
 */
export async function upsertRecipients(
  rows: { email: string; orgName?: string | null }[],
): Promise<{ added: number; updated: number }> {
  const seen = new Map<string, string | null>();
  for (const r of rows) {
    const email = r.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) continue;
    const org = r.orgName?.trim() || null;
    // Last non-null org name wins for duplicate emails in the same batch.
    if (!seen.has(email) || org) seen.set(email, org);
  }
  const values = [...seen].map(([email, orgName]) => ({ email, orgName }));
  if (values.length === 0) return { added: 0, updated: 0 };
  const affected = await db()
    .insert(recipients)
    .values(values)
    .onConflictDoUpdate({
      target: recipients.email,
      // Only overwrite an existing org name when the new import actually has one.
      set: { orgName: sql`coalesce(excluded.org_name, ${recipients.orgName})` },
    })
    // xmax = 0 marks a freshly inserted row; anything else was an update.
    .returning({ inserted: sql<boolean>`(xmax = 0)`.as("inserted") });
  const added = affected.filter((r) => r.inserted).length;
  return { added, updated: affected.length - added };
}

/** Add emails, skipping any already present. */
export async function addRecipients(emails: string[]): Promise<{ added: number; skipped: number }> {
  const values = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))].map(
    (email) => ({ email }),
  );
  if (values.length === 0) return { added: 0, skipped: 0 };
  const inserted = await db()
    .insert(recipients)
    .values(values)
    .onConflictDoNothing({ target: recipients.email })
    .returning({ email: recipients.email });
  return { added: inserted.length, skipped: values.length - inserted.length };
}

export async function removeRecipient(emailRaw: string): Promise<void> {
  await db().delete(recipients).where(eq(recipients.email, emailRaw.trim().toLowerCase()));
}

/** Remove many recipients at once. Returns how many rows were deleted. */
export async function removeRecipients(emailsRaw: string[]): Promise<number> {
  const emails = [...new Set(emailsRaw.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return 0;
  const deleted = await db()
    .delete(recipients)
    .where(inArray(recipients.email, emails))
    .returning({ id: recipients.id });
  return deleted.length;
}
