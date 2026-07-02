/**
 * An announcement is one small typed file. The `summary` (and optional
 * `highlights`) are the "gist" that goes in the email; `changelogUrl` links to
 * the full write-up in the docs changelog. Author one file per announcement in
 * content/announcements/ and send it with `pnpm send <slug>`.
 */
export type Announcement = {
  /** URL-safe id, must match the filename (e.g. "cross-chain-withdrawals"). */
  slug: string;
  /** Email subject line + headline. */
  title: string;
  /** One-line teaser shown as email preview text (inbox preview). */
  preview: string;
  /** The gist — 1–3 short paragraphs. Plain text; blank strings are ignored. */
  summary: string[];
  /** Optional bullet highlights ("what's new"). */
  highlights?: string[];
  /** Link to the full write-up in the docs changelog. */
  changelogUrl: string;
  /** Call-to-action button label. */
  cta?: string;
};

/** Small helper so each announcement file gets full type-checking + inference. */
export function defineAnnouncement(a: Announcement): Announcement {
  return a;
}
