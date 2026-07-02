import { getMailer } from "./mailer";
import { renderAnnouncementHtml, renderAnnouncementText } from "./renderEmail";
import type { Announcement } from "../../content/types";

const UNSUB_PLACEHOLDER = "%%UNSUB%%";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

// View-only unsubscribe link (no suppression store). Satisfies the
// List-Unsubscribe header; the /unsubscribe page just shows a confirmation.
function unsubUrl(email: string): string {
  return `${appUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
}

/** Send a single test email (subject prefixed [TEST]). */
export async function sendTest(announcement: Announcement, to: string) {
  const html = await renderAnnouncementHtml(announcement, unsubUrl(to));
  const text = await renderAnnouncementText(announcement);
  return getMailer().send({ to, subject: `[TEST] ${announcement.title}`, html, text });
}

export type SendResult = { requested: number; sent: number; failed: number; errors: string[] };

/**
 * Send the announcement to the given emails via Gmail, one at a time. Each
 * recipient gets a view-only unsubscribe link + one-click List-Unsubscribe
 * header.
 */
export async function sendToRecipients(
  announcement: Announcement,
  emails: string[],
): Promise<SendResult> {
  const targets = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const result: SendResult = { requested: emails.length, sent: 0, failed: 0, errors: [] };
  if (targets.length === 0) return result;

  const mailer = getMailer();
  const subject = announcement.title;
  const baseHtml = await renderAnnouncementHtml(announcement, UNSUB_PLACEHOLDER);
  const text = await renderAnnouncementText(announcement);

  for (const email of targets) {
    const url = unsubUrl(email);
    const { error } = await mailer.send({
      to: email,
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
      result.errors.push(`${email}: ${error}`);
    } else {
      result.sent++;
    }
  }

  return result;
}
