/**
 * One-off importer: read a CSV and add its "Email" column to the recipients
 * table (idempotent — existing addresses are skipped).
 *
 *   pnpm tsx scripts/import-csv.tsx data/organizations-2026-07-03.csv
 *
 * Defaults to the most recent organizations CSV in data/ if no path is given.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { upsertRecipients } from "../src/lib/recipients";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* absent, fine */
  }
}

// Minimal CSV row splitter that respects double-quoted fields.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function resolveFile(): Promise<string> {
  const arg = process.argv[2];
  if (arg) return arg;
  const files = (await readdir("data")).filter((f) => f.toLowerCase().endsWith(".csv")).sort();
  if (files.length === 0) throw new Error("No CSV given and none found in data/");
  return path.join("data", files[files.length - 1]);
}

async function main() {
  const file = await resolveFile();
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error(`${file} has no data rows`);

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  const orgIdx = header.indexOf("organization name");
  if (emailIdx === -1) throw new Error(`No "Email" column in header: ${header.join(", ")}`);

  const rows = lines
    .slice(1)
    .map((line) => {
      const cols = splitCsvLine(line);
      return {
        email: (cols[emailIdx] ?? "").trim().toLowerCase(),
        orgName: orgIdx === -1 ? null : (cols[orgIdx] ?? "").trim() || null,
      };
    })
    .filter((r) => EMAIL_RE.test(r.email));

  console.log(`File:            ${file}`);
  console.log(`Data rows:       ${lines.length - 1}`);
  console.log(`Valid emails:    ${rows.length}`);

  const { added, updated } = await upsertRecipients(rows);
  console.log(`Added:           ${added}`);
  console.log(`Updated (org):   ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
