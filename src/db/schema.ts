import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** The curated recipient list you manage on /recipients. */
export const recipients = pgTable("recipients", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RecipientRow = typeof recipients.$inferSelect;

/**
 * Drafts are the only persisted data. Recipients are not stored as a list;
 * they're imported from your API into the compose page per session. When a
 * draft is sent, the exact recipient emails are recorded on the draft as send
 * history.
 */
export const drafts = pgTable("drafts", {
  id: serial("id").primaryKey(),
  // Raw compose-form fields (summary/highlights are the textarea text).
  title: text("title").notNull().default(""),
  label: text("label").notNull().default(""),
  preview: text("preview").notNull().default(""),
  summary: text("summary").notNull().default(""),
  highlights: text("highlights").notNull().default(""),
  changelogUrl: text("changelog_url").notNull().default(""),
  cta: text("cta").notNull().default(""),
  status: text("status", { enum: ["draft", "sent"] })
    .notNull()
    .default("draft"),
  // The emails this draft was sent to (null until sent).
  recipients: jsonb("recipients").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type DraftRow = typeof drafts.$inferSelect;
