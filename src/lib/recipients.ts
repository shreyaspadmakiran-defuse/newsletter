import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { recipients } from "../db/schema";

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
