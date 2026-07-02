"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
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

type DraftMeta = { id: number; title: string; status: "draft" | "sent" };

const EMPTY: Form = {
  label: "",
  title: "",
  preview: "",
  summary: "",
  highlights: "",
  changelogUrl: "",
  cta: "",
};

const EXAMPLE: Form = {
  label: "New · Security",
  title: "The SHIELD Incident API is live",
  preview: "See ongoing incidents in real time, and report your own.",
  summary:
    "The SHIELD Incident API is now available. It reports any ongoing incident in real time, pulling directly from our internal circuit breakers and SHIELD.\n\nA GET request returns either `operational` or the current list of active incidents, each scoped to an affected chain, bridge, token, or address.",
  highlights:
    "Pull active incidents in real time from one endpoint\nReport incidents from your own systems\nBacked by our circuit breakers and SHIELD",
  changelogUrl: "https://docs.near-intents.org/security-compliance/shield-incident-api",
  cta: "Read the docs",
};

export default function ComposePage() {
  const [form, setForm] = useState<Form>(EXAMPLE);
  const [html, setHtml] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Recipients are loaded from the saved list (managed on /recipients).
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState<null | "test" | "send">(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadDrafts = useCallback(async () => {
    try {
      const res = await fetch("/api/drafts");
      const data = await res.json();
      if (res.ok) setDrafts(data.drafts ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const applyDraft = useCallback((d: Record<string, string> & { id: number }) => {
    setCurrentDraftId(d.id);
    setForm({
      label: d.label ?? "",
      title: d.title ?? "",
      preview: d.preview ?? "",
      summary: d.summary ?? "",
      highlights: d.highlights ?? "",
      changelogUrl: d.changelogUrl ?? "",
      cta: d.cta ?? "",
    });
    setStatus(null);
  }, []);

  const loadRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/recipients");
      const data = await res.json();
      if (res.ok) {
        const list: string[] = data.recipients ?? [];
        setRecipients(list);
        setSelected(new Set(list));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Load drafts + recipients, and a specific draft if ?draft=<id> is in the URL.
  useEffect(() => {
    loadDrafts();
    loadRecipients();
    const id = new URLSearchParams(window.location.search).get("draft");
    if (id) {
      fetch(`/api/drafts/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.draft && applyDraft(d.draft))
        .catch(() => {});
    }
  }, [loadDrafts, loadRecipients, applyDraft]);

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
      /* ignore */
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

  // ── Drafts ──────────────────────────────────────────────────────────────
  function newDraft() {
    setCurrentDraftId(null);
    setForm(EMPTY);
    setStatus(null);
  }

  function loadDraftById(id: number) {
    fetch(`/api/drafts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.draft && applyDraft(d.draft))
      .catch(() => {});
  }

  async function saveDraft() {
    setSavingDraft(true);
    setStatus(null);
    try {
      const res = await fetch(currentDraftId ? `/api/drafts/${currentDraftId}` : "/api/drafts", {
        method: currentDraftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.draft?.id) setCurrentDraftId(data.draft.id);
        await loadDrafts();
        setStatus({ kind: "ok", msg: "Draft saved." });
      } else {
        setStatus({ kind: "err", msg: data.error });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
    } finally {
      setSavingDraft(false);
    }
  }

  async function deleteCurrentDraft() {
    if (!currentDraftId) return;
    await fetch(`/api/drafts/${currentDraftId}`, { method: "DELETE" });
    newDraft();
    await loadDrafts();
  }

  // ── Send ──────────────────────────────────────────────────────────────────
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
    setBusy(mode);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement: form,
          mode,
          to: testEmail || undefined,
          recipients: [...selected],
          draftId: currentDraftId ?? undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ kind: "ok", msg: data.message });
        if (mode === "send") {
          if (data.draftId) setCurrentDraftId(data.draftId);
          await loadDrafts();
        }
      } else {
        setStatus({ kind: "err", msg: data.error });
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Compose announcement</h1>
            <p className="text-sm text-zinc-500">Write it, pick recipients, send.</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/recipients" className="font-medium text-zinc-600 hover:text-zinc-900">
              Recipients
            </Link>
            <Link href="/drafts" className="font-medium text-zinc-600 hover:text-zinc-900">
              Drafts
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="font-medium text-zinc-400 hover:text-zinc-900"
            >
              Sign out
            </button>
          </nav>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3">
              <span className="text-sm font-medium text-zinc-700">Draft</span>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
                value={currentDraftId ?? ""}
                onChange={(e) => (e.target.value ? loadDraftById(Number(e.target.value)) : newDraft())}
              >
                <option value="">New (unsaved)</option>
                {drafts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title || "(untitled)"}
                    {d.status === "sent" ? " · sent" : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={saveDraft}
                disabled={savingDraft}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                {savingDraft ? "Saving…" : currentDraftId ? "Save" : "Save draft"}
              </button>
              <button
                onClick={newDraft}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
              >
                New
              </button>
              {currentDraftId !== null && (
                <button onClick={deleteCurrentDraft} className="ml-auto text-sm text-zinc-400 hover:text-red-600">
                  Delete
                </button>
              )}
            </div>

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
                  Recipients · {selected.size}/{recipients.length} selected
                </span>
                <div className="flex flex-wrap gap-3 text-xs">
                  <Link href="/recipients" className="font-medium text-[#fb4d01] hover:underline">
                    Manage
                  </Link>
                  <button className="text-zinc-500 hover:text-zinc-900" onClick={() => setSelected(new Set(recipients))}>
                    Select all
                  </button>
                  <button className="text-zinc-500 hover:text-zinc-900" onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-auto">
                {recipients.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-400">
                    No recipients yet.{" "}
                    <Link href="/recipients" className="text-[#fb4d01] hover:underline">
                      Add some →
                    </Link>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {recipients.map((email) => (
                      <li key={email} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-zinc-50">
                        <input type="checkbox" checked={selected.has(email)} onChange={() => toggle(email)} />
                        <span className="flex-1 text-sm">{email}</span>
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
              <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</p>
            )}
          </div>

          {/* Live preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Live preview</span>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!html) return;
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({
                          "text/html": new Blob([html], { type: "text/html" }),
                          "text/plain": new Blob([html], { type: "text/plain" }),
                        }),
                      ]);
                      setStatus({ kind: "ok", msg: "Copied. Paste into Gmail (Cmd/Ctrl+V) and send." });
                    } catch {
                      setStatus({ kind: "err", msg: "Clipboard blocked. Use Download .html." });
                    }
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Copy for Gmail
                </button>
                <button
                  onClick={() => {
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
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
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
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900">
              Send to {selected.size} recipient{selected.size === 1 ? "" : "s"}?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">This sends the email now and cannot be undone.</p>
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
