"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function RecipientsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/recipients");
      const data = await res.json();
      if (res.ok) setEmails(data.recipients ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(input: string) {
    if (!input.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (res.ok) {
        setText("");
        await load();
        setStatus({ kind: "ok", msg: data.message });
      } else {
        setStatus({ kind: "err", msg: data.error });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await add(await file.text());
    e.target.value = "";
  }

  async function remove(email: string) {
    await fetch("/api/recipients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await load();
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Recipients</h1>
            <p className="text-sm text-zinc-500">{emails.length} saved. These are who you can send to.</p>
          </div>
          <Link href="/compose" className="text-sm font-medium text-[#fb4d01] hover:underline">
            Compose →
          </Link>
        </header>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <textarea
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            rows={4}
            placeholder="paste emails — one per line, or separated by commas/spaces"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                add(text);
              }
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => add(text)}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#fb4d01" }}
            >
              {busy ? "Adding…" : "Add emails"}
            </button>
            <label className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Upload .csv / .txt
              <input type="file" accept=".csv,.txt,text/plain,text/csv" className="hidden" onChange={onUpload} />
            </label>
          </div>
          {status && (
            <p className={`mt-2 text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
              {status.msg}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white">
          {emails.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">No recipients yet. Add some above.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {emails.map((email) => (
                <li key={email} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-sm">{email}</span>
                  <button
                    onClick={() => remove(email)}
                    className="text-xs text-zinc-400 hover:text-red-600"
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
