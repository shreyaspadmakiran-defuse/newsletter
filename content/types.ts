/**
 * One announcement per file. `summary` and `highlights` are the email body;
 * `changelogUrl` links to the full write-up in the docs. Author a file in
 * content/announcements/ and send it with `pnpm send <slug>`.
 */
export type Announcement = {
  /** URL-safe id. Must match the filename (e.g. "cross-chain-withdrawals"). */
  slug: string;
  /** Optional eyebrow tag above the title, e.g. "New feature". */
  label?: string;
  /** Email subject line and headline. */
  title: string;
  /** Inbox preview text (the grey line next to the subject). */
  preview: string;
  /** Body paragraphs. Blank strings are dropped. */
  summary: string[];
  /** Optional bullet list under the summary. */
  highlights?: string[];
  /** Link the button points to (the docs changelog page). */
  changelogUrl: string;
  /** Button label. Defaults to "Read the full changelog". */
  cta?: string;
};

/** Type-checks an announcement object as you write it. */
export function defineAnnouncement(a: Announcement): Announcement {
  return a;
}
