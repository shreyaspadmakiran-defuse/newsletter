/**
 * Campaign sender.
 *
 *   pnpm send <slug>                 Render + create a DRAFT broadcast in Resend, print its link.
 *   pnpm send <slug> --test you@x.com  Send a single test email to yourself (safe, one recipient).
 *   pnpm send <slug> --send          Create the broadcast AND blast it to the whole audience.
 *   pnpm send <slug> --html out.html Write the rendered HTML to a file and exit (offline preview).
 *
 * Always start with --test to yourself, eyeball it, then --send.
 */
import { render } from "@react-email/render";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { Resend } from "resend";
import { AnnouncementEmail } from "../emails/AnnouncementEmail";
import type { Announcement } from "../content/types";

// Load env from .env.local (falls back to .env). Node 20.12+/23 built-in.
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* file absent — fine */
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`\n✗ Missing env var ${name}. Copy .env.example → .env.local and fill it in.\n`);
    process.exit(1);
  }
  return v;
}

async function loadAnnouncement(slug: string): Promise<Announcement> {
  const file = path.resolve(process.cwd(), "content/announcements", `${slug}.ts`);
  try {
    const mod = await import(pathToFileURL(file).href);
    return mod.default as Announcement;
  } catch {
    console.error(`\n✗ No announcement found at content/announcements/${slug}.ts\n`);
    process.exit(1);
  }
}

async function main() {
  const [, , slug, flag, flagValue] = process.argv;

  if (!slug) {
    console.error("\nUsage: pnpm send <slug> [--test <email> | --send | --html <file>]\n");
    process.exit(1);
  }

  const announcement = await loadAnnouncement(slug);
  const element = createElement(AnnouncementEmail, { announcement });
  const html = await render(element);
  const text = await render(element, { plainText: true });

  // --html: offline preview, no Resend needed.
  if (flag === "--html") {
    const out = flagValue ?? `${slug}.html`;
    await writeFile(out, html, "utf8");
    console.log(`\n✓ Wrote ${out}\n`);
    return;
  }

  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const from = requireEnv("RESEND_FROM");
  const replyTo = process.env.RESEND_REPLY_TO || undefined;

  // --test: single one-off email to yourself.
  if (flag === "--test") {
    if (!flagValue) {
      console.error("\n✗ --test needs an email: pnpm send <slug> --test you@example.com\n");
      process.exit(1);
    }
    const { error } = await resend.emails.send({
      from,
      to: flagValue,
      replyTo,
      subject: `[TEST] ${announcement.title}`,
      html,
      text,
    });
    if (error) {
      console.error("\n✗ Test send failed:", error, "\n");
      process.exit(1);
    }
    console.log(`\n✓ Test sent to ${flagValue}\n`);
    return;
  }

  // Create a broadcast against the audience (this is what carries unsubscribe).
  const audienceId = requireEnv("RESEND_AUDIENCE_ID");
  const created = await resend.broadcasts.create({
    audienceId,
    from,
    replyTo,
    subject: announcement.title,
    name: `${announcement.slug} · ${new Date().toISOString().slice(0, 10)}`,
    html,
  });

  if (created.error || !created.data) {
    console.error("\n✗ Could not create broadcast:", created.error, "\n");
    process.exit(1);
  }

  const broadcastId = created.data.id;
  const dashUrl = `https://resend.com/broadcasts/${broadcastId}`;

  // --send: actually blast it. Otherwise leave it as a reviewable draft.
  if (flag === "--send") {
    const sent = await resend.broadcasts.send(broadcastId);
    if (sent.error) {
      console.error("\n✗ Broadcast created but send failed:", sent.error);
      console.error(`  Review/send manually: ${dashUrl}\n`);
      process.exit(1);
    }
    console.log(`\n✓ Broadcast sent to audience ${audienceId}`);
    console.log(`  ${dashUrl}\n`);
    return;
  }

  console.log(`\n✓ Draft broadcast created (not sent).`);
  console.log(`  Review + send from the dashboard: ${dashUrl}`);
  console.log(`  Or blast it now:  pnpm send ${slug} --send\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
