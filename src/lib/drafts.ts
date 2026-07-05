import { and, desc, eq } from "drizzle-orm";
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

/** Drafts are owned by the user who created them; every read/write is scoped by owner. */
export async function listDrafts(owner: string): Promise<DraftRow[]> {
  return db().select().from(drafts).where(eq(drafts.createdBy, owner)).orderBy(desc(drafts.updatedAt));
}

export async function getDraft(id: number, owner: string): Promise<DraftRow | null> {
  const [row] = await db()
    .select()
    .from(drafts)
    .where(and(eq(drafts.id, id), eq(drafts.createdBy, owner)));
  return row ?? null;
}

export async function createDraft(input: DraftInput, owner: string): Promise<DraftRow> {
  const [row] = await db()
    .insert(drafts)
    .values({ ...input, createdBy: owner, updatedBy: owner })
    .returning();
  return row;
}

export async function updateDraft(
  id: number,
  input: Partial<DraftInput>,
  owner: string,
): Promise<DraftRow | null> {
  const [row] = await db()
    .update(drafts)
    .set({ ...input, updatedBy: owner, updatedAt: new Date() })
    .where(and(eq(drafts.id, id), eq(drafts.createdBy, owner)))
    .returning();
  return row ?? null;
}

/** Record a send: mark sent, stamp time, store who it went to and who sent it. */
export async function markSent(
  id: number,
  recipients: string[],
  sentBy: string,
): Promise<DraftRow | null> {
  const [row] = await db()
    .update(drafts)
    .set({
      status: "sent",
      sentAt: new Date(),
      sentBy,
      recipients,
      updatedBy: sentBy,
      updatedAt: new Date(),
    })
    .where(and(eq(drafts.id, id), eq(drafts.createdBy, sentBy)))
    .returning();
  return row ?? null;
}

export async function deleteDraft(id: number, owner: string): Promise<void> {
  await db().delete(drafts).where(and(eq(drafts.id, id), eq(drafts.createdBy, owner)));
}
