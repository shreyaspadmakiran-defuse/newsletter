/**
 * Content-file helper. Sending to a recipient list happens in the web app
 * (/compose); this is for previewing/testing an announcement file locally.
 *
 *   pnpm send <slug> --html out.html     Render to a file (offline preview).
 *   pnpm send <slug> --test you@x.com     Send one test email via Gmail.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Announcement } from "../content/types";
import { renderAnnouncementHtml } from "../src/lib/renderEmail";
import { sendTest } from "../src/lib/send";

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
    console.error("\nUsage: pnpm send <slug> [--html <file> | --test <email>]\n");
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

  console.error("\nUsage: pnpm send <slug> [--html <file> | --test <email>]\n");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
