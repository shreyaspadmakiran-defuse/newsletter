import { randomUUID } from "node:crypto";

/**
 * In-memory subscriber list. It resets when the server restarts.
 *
 * The intended source of truth is an external API (see src/lib/importSource.ts):
 * you click Import, the app pulls emails from that API into this store, and
 * sends go to the selected addresses. Because you re-import, persistence isn't
 * required. If you later want the list to survive restarts, replace the `store`
 * array below with a DB — the exported functions are the interface; callers
 * don't change.
 *
 * Note: unsubscribe tokens live here too, so they reset on restart. An
 * unsubscribe link from an email sent before a restart won't resolve until the
 * list is re-imported.
 */
export type Subscriber = {
  email: string;
  token: string;
  subscribedAt: string;
  unsubscribed: boolean;
};

let store: Subscriber[] = [];

const normalize = (email: string) => email.trim().toLowerCase();

export async function listSubscribers(): Promise<Subscriber[]> {
  return [...store];
}

export async function activeSubscribers(): Promise<Subscriber[]> {
  return store.filter((s) => !s.unsubscribed);
}

/** Add an email (or re-activate an unsubscribed one). Idempotent. */
export async function addSubscriber(emailRaw: string): Promise<Subscriber> {
  const email = normalize(emailRaw);
  const existing = store.find((s) => s.email === email);
  if (existing) {
    existing.unsubscribed = false;
    return existing;
  }
  const sub: Subscriber = {
    email,
    token: randomUUID(),
    subscribedAt: new Date().toISOString(),
    unsubscribed: false,
  };
  store.push(sub);
  return sub;
}

/**
 * Bulk-add emails (from a file, paste, or the external API). Existing emails
 * keep their current state; only new ones are added.
 */
export async function importSubscribers(
  items: { email: string; unsubscribed?: boolean }[],
): Promise<{ added: number; skipped: number }> {
  const have = new Set(store.map((s) => s.email));
  let added = 0;
  let skipped = 0;
  for (const it of items) {
    const email = normalize(it.email);
    if (!email || have.has(email)) {
      skipped++;
      continue;
    }
    have.add(email);
    store.push({
      email,
      token: randomUUID(),
      subscribedAt: new Date().toISOString(),
      unsubscribed: Boolean(it.unsubscribed),
    });
    added++;
  }
  return { added, skipped };
}

/** Delete an email from the list entirely. */
export async function removeSubscriber(emailRaw: string): Promise<void> {
  const email = normalize(emailRaw);
  store = store.filter((s) => s.email !== email);
}

/** Mark unsubscribed (kept in the list, excluded from sends). */
export async function unsubscribeByToken(token: string): Promise<Subscriber | null> {
  const sub = store.find((s) => s.token === token);
  if (!sub) return null;
  sub.unsubscribed = true;
  return sub;
}
