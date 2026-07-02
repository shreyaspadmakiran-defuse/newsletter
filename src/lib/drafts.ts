import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { drafts, type DraftRow } from "../db/schema";

/** The compose-form fields, stored as-is (summary/highlights are textarea text). */
export type DraftInput = {
  title: string;
  label: string;
  preview: string;
  summary: string;
  highlights: string;
  changelogUrl: string;
  cta: string;
};

export async function listDrafts(): Promise<DraftRow[]> {
  return db().select().from(drafts).orderBy(desc(drafts.updatedAt));
}

export async function getDraft(id: number): Promise<DraftRow | null> {
  const [row] = await db().select().from(drafts).where(eq(drafts.id, id));
  return row ?? null;
}

export async function createDraft(input: DraftInput): Promise<DraftRow> {
  const [row] = await db().insert(drafts).values(input).returning();
  return row;
}

export async function updateDraft(id: number, input: Partial<DraftInput>): Promise<DraftRow | null> {
  const [row] = await db()
    .update(drafts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(drafts.id, id))
    .returning();
  return row ?? null;
}

/** Record a send: mark sent, stamp time, and store who it went to. */
export async function markSent(id: number, recipients: string[]): Promise<DraftRow | null> {
  const [row] = await db()
    .update(drafts)
    .set({ status: "sent", sentAt: new Date(), recipients, updatedAt: new Date() })
    .where(eq(drafts.id, id))
    .returning();
  return row ?? null;
}

export async function deleteDraft(id: number): Promise<void> {
  await db().delete(drafts).where(eq(drafts.id, id));
}
