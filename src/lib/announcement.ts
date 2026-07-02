import { z } from "zod";
import type { Announcement } from "../../content/types";

/** Raw shape posted from the compose form (summary/highlights are freeform text). */
export const announcementInputSchema = z.object({
  label: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
  preview: z.string().trim().min(1, "Preview text is required"),
  // Paragraphs separated by a blank line.
  summary: z.string().trim().min(1, "Summary is required"),
  // One highlight per line (optional).
  highlights: z.string().optional(),
  changelogUrl: z.string().trim().url("Changelog URL must be a valid URL"),
  cta: z.string().trim().optional(),
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

/** Convert freeform form input into a structured Announcement. */
export function buildAnnouncement(input: AnnouncementInput): Announcement {
  const summary = input.summary
    .split(/\n\s*\n/) // blank line separates paragraphs
    .map((p) => p.replace(/\s+\n/g, " ").trim())
    .filter(Boolean);

  const highlights = (input.highlights ?? "")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    slug: "preview",
    label: input.label || undefined,
    title: input.title,
    preview: input.preview,
    summary,
    highlights: highlights.length ? highlights : undefined,
    changelogUrl: input.changelogUrl,
    cta: input.cta || undefined,
  };
}
