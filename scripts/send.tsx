/**
 * Campaign sender (CLI). The subscriber list lives in the backend store; this
 * sends the announcement to those addresses via Gmail.
 *
 *   pnpm send <slug> --html out.html    Render to a file (offline preview, no send).
 *   pnpm send <slug> --test you@x.com    Send a single test email to yourself.
 *   pnpm send <slug>                     Show how many active recipients would get it.
 *   pnpm send <slug> --send              Send to every active subscriber in the store.
 *
 * Manage the list with `pnpm contacts`. Always --test yourself first.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Announcement } from "../content/types";
import { renderAnnouncementHtml } from "../src/lib/renderEmail";
import { sendTest, sendToRecipients } from "../src/lib/send";
import { activeSubscribers } from "../src/lib/subscribers";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* absent, fine */
  }
}

async function loadAnnouncement(slug: string): Promise<Announcement> {
  const file = path.resolve(process.cwd(), "content/announcements", `${slug}.ts`);
  try {
    const mod = await import(pathToFileURL(file).href);
    return mod.default as Announcement;
  } catch {
    console.error(`\n✗ No announcement at content/announcements/${slug}.ts\n`);
    process.exit(1);
  }
}

async function main() {
  const [, , slug, flag, flagValue] = process.argv;
  if (!slug) {
    console.error("\nUsage: pnpm send <slug> [--html <file> | --test <email> | --send]\n");
    process.exit(1);
  }

  const announcement = await loadAnnouncement(slug);

  if (flag === "--html") {
    const out = flagValue ?? `${slug}.html`;
    await writeFile(out, await renderAnnouncementHtml(announcement), "utf8");
    console.log(`\n✓ Wrote ${out}\n`);
    return;
  }

  if (flag === "--test") {
    if (!flagValue) {
      console.error("\n✗ --test needs an email: pnpm send <slug> --test you@example.com\n");
      process.exit(1);
    }
    const { error } = await sendTest(announcement, flagValue);
    if (error) {
      console.error("\n✗ Test send failed:", error, "\n");
      process.exit(1);
    }
    console.log(`\n✓ Test sent to ${flagValue}\n`);
    return;
  }

  const active = await activeSubscribers();

  if (flag === "--send") {
    if (active.length === 0) {
      console.error("\n✗ No active subscribers. Add some with `pnpm contacts import <file>`.\n");
      process.exit(1);
    }
    const result = await sendToRecipients(announcement, active.map((s) => s.email));
    console.log(`\n✓ Sent to ${result.sent}${result.failed ? `, ${result.failed} failed` : ""}.`);
    if (result.errors.length) console.error("  errors:", result.errors.join("; "));
    console.log("");
    return;
  }

  console.log(`\n${active.length} active subscriber(s) would receive "${announcement.title}".`);
  console.log(`Preview:  pnpm send ${slug} --html ${slug}.html`);
  console.log(`Test:     pnpm send ${slug} --test you@example.com`);
  console.log(`Send now: pnpm send ${slug} --send\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
