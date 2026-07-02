import nodemailer from "nodemailer";
import { requireEnv } from "./env";

/**
 * Sends through your own Gmail account over SMTP using an App Password. No third
 * party and no domain to verify, because you authenticate as yourself.
 */
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
};

export type Mailer = {
  /** The From address mail is sent as. */
  from: string;
  send: (mail: Mail) => Promise<{ error?: string }>;
};

let cached: Mailer | null = null;

export function getMailer(): Mailer {
  if (cached) return cached;

  const user = requireEnv("GMAIL_USER");
  const pass = requireEnv("GMAIL_APP_PASSWORD");
  const from = `${process.env.MAIL_FROM_NAME || "NEAR Intents"} <${user}>`;
  const replyTo = process.env.MAIL_REPLY_TO || undefined;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  cached = {
    from,
    send: async (mail) => {
      try {
        await transporter.sendMail({ from, replyTo, ...mail });
        return {};
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
  return cached;
}
