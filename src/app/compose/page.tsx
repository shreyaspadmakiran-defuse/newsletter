"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Form = {
  label: string;
  title: string;
  preview: string;
  summary: string;
  highlights: string;
  changelogUrl: string;
  cta: string;
};

type Subscriber = { email: string; unsubscribed: boolean };

const EXAMPLE: Form = {
  label: "New · Security",
  title: "The SHIELD Incident API is live",
  preview: "See ongoing incidents in real time, and report your own.",
  summary:
    "The SHIELD Incident API is now available. It reports any ongoing incident in real time, pulling directly from our internal circuit breakers and SHIELD.\n\nA GET request returns either `operational` or the current list of active incidents, each scoped to an affected chain, bridge, token, or address. You can also POST an incident from your own systems. While an incident is active, SHIELD halts evaluation for the matching scope.",
  highlights:
    "Pull active incidents in real time from one endpoint\nReport incidents from your own systems, scoped to a chain, bridge, token, or address\nBacked by our circuit breakers and SHIELD: active incidents halt evaluation for the affected scope",
  changelogUrl: "https://docs.near-intents.org/security-compliance/shield-incident-api",
  cta: "Read the docs",
};

export default function ComposePage() {
  const [form, setForm] = useState<Form>(EXAMPLE);
  const [html, setHtml] = useState("");
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newEmail, setNewEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<null | "test" | "send">(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Load subscribers (all active ones selected by default).
  const loadSubs = useCallback(async () => {
    const res = await fetch("/api/subscribers");
    const data = await res.json();
    const list: Subscriber[] = data.subscribers ?? [];
    setSubs(list);
    setSelected(new Set(list.filter((s) => !s.unsubscribed).map((s) => s.email)));
  }, []);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  // Debounced live preview.
  const renderPreview = useCallback(async (f: Form) => {
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (res.ok) setHtml(data.html);
    } catch {
      /* ignore while typing */
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => renderPreview(form), 350);
    return () => clearTimeout(debounce.current);
  }, [form, renderPreview]);

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  // Accepts one email or many (any separators: newlines, commas, spaces).
  async function addEmails(text: string) {
    if (!text.trim()) return;
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus({ kind: "err", msg: data.error });
      return;
    }
    setNewEmail("");
    await loadSubs();
    // Auto-select everything just added.
    const added = text
      .split(/[\s,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    setSelected((prev) => new Set([...prev, ...added]));
    if (data.message) setStatus({ kind: "ok", msg: data.message });
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await addEmails(await file.text());
    e.target.value = ""; // allow re-uploading the same file
  }

  const [importing, setImporting] = useState(false);
  async function importFromApi() {
    setImporting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/subscribers/import", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await loadSubs();
        setStatus({ kind: "ok", msg: data.message });
      } else {
        setStatus({ kind: "err", msg: data.error });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
    } finally {
      setImporting(false);
    }
  }

  async function removeEmail(email: string) {
    await fetch("/api/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await loadSubs();
  }

  // Opens the confirmation modal for a real send.
  function requestSend() {
    setStatus(null);
    if (selected.size === 0) {
      setStatus({ kind: "err", msg: "Select at least one recipient." });
      return;
    }
    setConfirmOpen(true);
  }

  async function performSend(mode: "test" | "send") {
    setStatus(null);
    if (mode === "test" && !testEmail) {
      setStatus({ kind: "err", msg: "Enter a test email address first." });
      return;
    }
    const recipients = [...selected];
    if (mode === "send" && recipients.length === 0) {
      setStatus({ kind: "err", msg: "Select at least one recipient." });
      return;
    }

    setBusy(mode);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement: form, mode, to: testEmail || undefined, recipients }),
      });
      const data = await res.json();
      setStatus(res.ok ? { kind: "ok", msg: data.message } : { kind: "err", msg: data.error });
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function copyForGmail() {
    if (!html) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
      setStatus({ kind: "ok", msg: "Copied. Paste into a Gmail compose window (Cmd/Ctrl+V), add recipients, and send." });
    } catch {
      setStatus({ kind: "err", msg: "Browser blocked the clipboard. Use Download .html instead." });
    }
  }

  function downloadHtml() {
    if (!html) return;
    const slug =
      (form.title || "email").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "email";
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const activeCount = subs.filter((s) => !s.unsubscribed).length;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold">Compose announcement</h1>
          <p className="text-sm text-zinc-500">
            Write it, pick recipients, send a test, then send for real.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow label (optional)">
              <input className={inputCls} value={form.label} onChange={set("label")} />
            </Field>
            <Field label="Title / subject">
              <input className={inputCls} value={form.title} onChange={set("title")} />
            </Field>
            <Field label="Inbox preview text">
              <input className={inputCls} value={form.preview} onChange={set("preview")} />
            </Field>
            <Field label="Summary (blank line = new paragraph)">
              <textarea className={inputCls} rows={6} value={form.summary} onChange={set("summary")} />
            </Field>
            <Field label="Highlights (one per line, optional)">
              <textarea className={inputCls} rows={4} value={form.highlights} onChange={set("highlights")} />
            </Field>
            <Field label="Changelog URL (button link)">
              <input className={inputCls} value={form.changelogUrl} onChange={set("changelogUrl")} />
            </Field>
            <Field label="Button label">
              <input className={inputCls} value={form.cta} onChange={set("cta")} />
            </Field>

            {/* Recipients */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">
                  Recipients · {selected.size}/{activeCount} selected
                </span>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    className="font-medium text-[#fb4d01] hover:underline disabled:opacity-50"
                    onClick={importFromApi}
                    disabled={importing}
                    title="Pull emails from the external API"
                  >
                    {importing ? "Importing…" : "Import"}
                  </button>
                  <button
                    className="text-zinc-500 hover:text-zinc-900"
                    onClick={() => setSelected(new Set(subs.filter((s) => !s.unsubscribed).map((s) => s.email)))}
                  >
                    Select all
                  </button>
                  <button className="text-zinc-500 hover:text-zinc-900" onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="mb-3 flex flex-col gap-2">
                <textarea
                  className={inputCls}
                  rows={2}
                  placeholder="paste one email, or many, separated by new lines, commas, or spaces"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      addEmails(newEmail);
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addEmails(newEmail)}
                    className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                  >
                    Add emails
                  </button>
                  <label className="shrink-0 cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
                    Upload .csv / .txt
                    <input type="file" accept=".csv,.txt,text/plain,text/csv" className="hidden" onChange={onUploadFile} />
                  </label>
                  <span className="text-xs text-zinc-400">⌘/Ctrl+Enter to add</span>
                </div>
              </div>

              <div className="max-h-56 overflow-auto">
                {subs.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-400">
                    No recipients yet. Add one above, or from the subscribe page.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {subs.map((s) => (
                      <li key={s.email} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-zinc-50">
                        <input
                          type="checkbox"
                          checked={selected.has(s.email)}
                          disabled={s.unsubscribed}
                          onChange={() => toggle(s.email)}
                        />
                        <span className={`flex-1 text-sm ${s.unsubscribed ? "text-zinc-300 line-through" : ""}`}>
                          {s.email}
                          {s.unsubscribed && <span className="ml-2 text-xs">unsubscribed</span>}
                        </span>
                        <button
                          onClick={() => removeEmail(s.email)}
                          className="text-xs text-zinc-400 hover:text-red-600"
                          title="Remove from list"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Field label="Test email">
              <input
                className={inputCls}
                placeholder="you@near-intents.org"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </Field>

            <div className="flex gap-3">
              <button
                onClick={() => performSend("test")}
                disabled={busy !== null}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                {busy === "test" ? "Sending test…" : "Send test"}
              </button>
              <button
                onClick={requestSend}
                disabled={busy !== null}
                className="flex-1 rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#fb4d01" }}
              >
                {busy === "send" ? "Sending…" : `Send to ${selected.size} selected`}
              </button>
            </div>

            {status && (
              <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
                {status.msg}
              </p>
            )}
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Live preview</span>
              <div className="flex gap-2">
                <button
                  onClick={copyForGmail}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  title="Copy the email as rich HTML, then paste into a Gmail compose window"
                >
                  Copy for Gmail
                </button>
                <button
                  onClick={downloadHtml}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  title="Download the rendered email as an .html file"
                >
                  Download .html
                </button>
              </div>
            </div>
            <iframe
              title="Email preview"
              srcDoc={html}
              className="h-[720px] w-full rounded-xl border border-zinc-200 bg-white"
            />
          </div>
        </div>
      </div>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Send to {selected.size} recipient{selected.size === 1 ? "" : "s"}?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              This sends the email now and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  performSend("send");
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#fb4d01" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
