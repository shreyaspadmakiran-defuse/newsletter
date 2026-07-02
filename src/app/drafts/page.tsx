import Link from "next/link";
import { listDrafts } from "@/lib/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh from the DB

function fmt(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DraftsPage() {
  const drafts = await listDrafts();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Drafts</h1>
            <p className="text-sm text-zinc-500">Saved announcements and what's been sent.</p>
          </div>
          <Link href="/compose" className="text-sm font-medium text-[#fb4d01] hover:underline">
            + New announcement
          </Link>
        </header>

        {drafts.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
            No drafts yet. <Link href="/compose" className="text-[#fb4d01] hover:underline">Write one →</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {drafts.map((d) => (
              <li key={d.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === "sent"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {d.status === "sent" ? "Sent" : "Draft"}
                      </span>
                      <h2 className="truncate font-medium">{d.title || "(untitled)"}</h2>
                    </div>
                    {d.status === "sent" ? (
                      <p className="mt-1 text-sm text-zinc-500">
                        Sent {fmt(d.sentAt)} to {d.recipients?.length ?? 0} recipient
                        {(d.recipients?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">Last edited {fmt(d.updatedAt)}</p>
                    )}
                  </div>
                  <Link
                    href={`/compose?draft=${d.id}`}
                    className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                </div>

                {d.status === "sent" && d.recipients && d.recipients.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900">
                      Recipients ({d.recipients.length})
                    </summary>
                    <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                      {d.recipients.join(", ")}
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
