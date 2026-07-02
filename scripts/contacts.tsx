/**
 * Manage the subscriber list (the backend store, data/subscribers.json).
 *
 *   pnpm contacts list                 List every email in the store.
 *   pnpm contacts import <file>        Add emails from a file, skipping duplicates.
 *   pnpm contacts import <file> --dry  Show what would be added, add nothing.
 *
 * The file can be newline-, comma-, or semicolon-separated (plain .txt or a
 * one-column CSV). Anything that isn't a valid email is ignored.
 */
import { readFile } from "node:fs/promises";
import { addSubscriber, listSubscribers } from "../src/lib/subscribers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => EMAIL_RE.test(t));
  return [...new Set(tokens)];
}

async function main() {
  const cmd = process.argv[2];

  if (cmd === "list") {
    const subs = await listSubscribers();
    if (subs.length === 0) {
      console.log("\n(no subscribers yet)\n");
      return;
    }
    console.log(`\n${subs.length} subscriber(s):\n`);
    for (const s of subs) {
      console.log(`  ${s.email}${s.unsubscribed ? "  (unsubscribed)" : ""}`);
    }
    console.log("");
    return;
  }

  if (cmd === "import") {
    const file = process.argv[3];
    const dry = process.argv.includes("--dry");
    if (!file) {
      console.error("\nUsage: pnpm contacts import <file> [--dry]\n");
      process.exit(1);
    }

    const raw = await readFile(file, "utf8").catch(() => {
      console.error(`\n✗ Could not read ${file}\n`);
      process.exit(1);
    });

    const emails = parseEmails(raw as string);
    if (emails.length === 0) {
      console.error("\n✗ No valid emails found in that file.\n");
      process.exit(1);
    }

    const existing = new Set((await listSubscribers()).map((s) => s.email));
    const toAdd = emails.filter((e) => !existing.has(e));

    console.log(`\n${emails.length} in file · ${emails.length - toAdd.length} already present · ${toAdd.length} to add`);

    if (dry) {
      console.log("\n[dry run] would add:\n");
      toAdd.forEach((e) => console.log(`  + ${e}`));
      console.log("\nRe-run without --dry to add them.\n");
      return;
    }

    for (const email of toAdd) {
      await addSubscriber(email);
      console.log(`  + ${email}`);
    }
    console.log(`\n✓ Added ${toAdd.length}.\n`);
    return;
  }

  console.error("\nUsage:\n  pnpm contacts list\n  pnpm contacts import <file> [--dry]\n");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
