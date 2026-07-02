export type ImportedEmail = { email: string; unsubscribed?: boolean };

/**
 * TODO: wire this up to your email-source API.
 *
 * The Import button on /compose calls this, then loads the returned emails into
 * the in-memory store. Right now it's a stub that throws — replace the body with
 * a real fetch to your API and map its response to `{ email }` objects.
 *
 * Example:
 *
 *   export async function fetchEmailsFromApi(): Promise<ImportedEmail[]> {
 *     const res = await fetch(process.env.EMAIL_SOURCE_API_URL!, {
 *       headers: { Authorization: `Bearer ${process.env.EMAIL_SOURCE_API_KEY}` },
 *     });
 *     if (!res.ok) throw new Error(`Email source API returned ${res.status}`);
 *     const data = await res.json();
 *     return data.contacts.map((c: { email: string }) => ({ email: c.email }));
 *   }
 *
 * Add EMAIL_SOURCE_API_URL / EMAIL_SOURCE_API_KEY to .env.local when you do.
 */
export async function fetchEmailsFromApi(): Promise<ImportedEmail[]> {
  throw new Error(
    "Import not configured. Wire up fetchEmailsFromApi() in src/lib/importSource.ts to your email-source API.",
  );
}
