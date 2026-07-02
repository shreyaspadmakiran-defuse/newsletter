"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You’re subscribed. Watch your inbox for product updates.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Product updates</h1>
        <p className="mt-2 text-zinc-600">
          Get NEAR Intents feature announcements in your inbox. No spam — just what shipped.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg px-4 py-3 font-semibold text-[var(--brand-text)] transition disabled:opacity-60"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm ${
              status === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
