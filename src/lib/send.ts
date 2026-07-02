import { getMailer } from "./mailer";
import { renderAnnouncementHtml, renderAnnouncementText } from "./renderEmail";
import { activeSubscribers } from "./subscribers";
import type { Announcement } from "../../content/types";

const UNSUB_PLACEHOLDER = "%%UNSUB%%";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function unsubUrl(token: string): string {
  return `${appUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Send a single test email (subject prefixed [TEST]). */
export async function sendTest(announcement: Announcement, to: string) {
  const html = await renderAnnouncementHtml(announcement, `${appUrl()}/unsubscribe?token=preview`);
  const text = await renderAnnouncementText(announcement);
  return getMailer().send({ to, subject: `[TEST] ${announcement.title}`, html, text });
}

export type SendResult = { requested: number; sent: number; failed: number; errors: string[] };

/**
 * Send the announcement to the given emails. Only addresses in the store and
 * still subscribed are mailed. Each recipient gets their own unsubscribe link
 * and one-click List-Unsubscribe header. Sent one at a time through Gmail.
 */
export async function sendToRecipients(
  announcement: Announcement,
  emails: string[],
): Promise<SendResult> {
  const active = new Map((await activeSubscribers()).map((s) => [s.email, s]));
  const targets = [...new Set(emails.map((e) => e.trim().toLowerCase()))]
    .map((e) => active.get(e))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const result: SendResult = { requested: emails.length, sent: 0, failed: 0, errors: [] };
  if (targets.length === 0) return result;

  const mailer = getMailer();
  const subject = announcement.title;
  const baseHtml = await renderAnnouncementHtml(announcement, UNSUB_PLACEHOLDER);
  const text = await renderAnnouncementText(announcement);

  for (const s of targets) {
    const url = unsubUrl(s.token);
    const { error } = await mailer.send({
      to: s.email,
      subject,
      html: baseHtml.split(UNSUB_PLACEHOLDER).join(url),
      text,
      headers: {
        "List-Unsubscribe": `<${url}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (error) {
      result.failed++;
      result.errors.push(`${s.email}: ${error}`);
    } else {
      result.sent++;
    }
  }

  return result;
}
