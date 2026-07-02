# defuse-newsletter

A branded email service for product announcements. You keep a list of recipient emails,
write an announcement, and send it as a styled email that links to the full write-up in
your docs changelog.

The recipient list is held in memory and is meant to be imported from an external API
(with manual add/upload as a fallback). Mail is sent through your own Gmail account, so
there is no third-party sending service and no domain to verify.

## How it works

```
Recipients live in an in-memory store (resets on restart):

  external API  ->  POST /api/subscribers/import  \
  compose page  ->  POST /api/subscribers          >-->  in-memory store
  CLI import    ->                                 /

Sending an announcement:

  content/announcements/<slug>.ts   (or the /compose form)
        |
        |  render with emails/AnnouncementEmail.tsx + emails/brand.ts
        v
  branded HTML  -->  Gmail (SMTP)  -->  selected recipients
        |
        \--  the email's button links to changelogUrl in your docs
```

Each recipient gets a per-recipient unsubscribe link and a one-click `List-Unsubscribe`
header. Unsubscribing marks them in the store and excludes them from future sends.

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
```

Mail goes through your own Gmail account over SMTP. Turn on 2-Step Verification, create an
App Password at https://myaccount.google.com/apppasswords, and set:

| Env var | Purpose |
|---|---|
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | The 16-character app password |
| `MAIL_FROM_NAME` | Display name on the From line, e.g. `NEAR Intents` |
| `MAIL_REPLY_TO` | Optional reply-to address |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app, used to build unsubscribe links |

Gmail limits: ~500 sends/day on personal Gmail, ~2,000 on Workspace.

## Run

```bash
pnpm dev          # app at http://localhost:3000
pnpm email:dev    # template preview at http://localhost:3030
```

- `/compose` is the admin page: manage recipients, write an announcement, and send.
- `/` redirects to `/compose`.

## Managing recipients

The list lives in an in-memory store (`src/lib/subscribers.ts`) that resets on restart.
Three ways to fill it:

1. **Import from your API** — the **Import** button on `/compose` calls
   [`fetchEmailsFromApi()`](src/lib/importSource.ts) and loads the result. That function is
   a **TODO stub** right now; wire it to your endpoint (see "Importing from an external API"
   below). This is the intended primary source.
2. **Manual** — the `/compose` recipients panel: paste one email or many (new lines, commas,
   or spaces), or upload a `.csv` / `.txt`.
3. **CLI:**

```bash
pnpm contacts list                  # show the stored list
pnpm contacts import emails.txt      # add from a file, skip duplicates
pnpm contacts import emails.txt --dry
```

## Importing from an external API

The **Import** button hits `POST /api/subscribers/import`, which calls
[`fetchEmailsFromApi()`](src/lib/importSource.ts). That function currently throws — replace
its body with a real fetch to your API and return `{ email }[]`:

```ts
export async function fetchEmailsFromApi(): Promise<ImportedEmail[]> {
  const res = await fetch(process.env.EMAIL_SOURCE_API_URL!, {
    headers: { Authorization: `Bearer ${process.env.EMAIL_SOURCE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Email source API returned ${res.status}`);
  const data = await res.json();
  return data.contacts.map((c: { email: string }) => ({ email: c.email }));
}
```

Add `EMAIL_SOURCE_API_URL` / `EMAIL_SOURCE_API_KEY` to `.env.local` when you wire it up.
Import is idempotent: it skips emails already in the store, so you can click it repeatedly.

## Sending an announcement

### From the browser

Open `/compose`. Fill in the fields, watch the live preview, check the recipients you want
(all are selected by default), send a test to yourself, then send to the selected recipients.
Sending goes out through your Gmail account.

### Copy it into Gmail yourself

`/compose` also has two buttons at the top-right of the preview:

- **Copy for Gmail** copies the rendered email to your clipboard as rich HTML. Open Gmail,
  paste into the compose body (Cmd/Ctrl+V), add recipients, and send.
- **Download .html** saves the rendered email to a file (the same output as
  `pnpm send <slug> --html out.html`).

### From the CLI

Write `content/announcements/<slug>.ts` (copy an existing file), then:

```bash
pnpm send <slug> --html out.html          # render to a file, no send
pnpm send <slug> --test you@example.com    # send one test email
pnpm send <slug>                           # print how many active recipients would get it
pnpm send <slug> --send                    # send to every active subscriber
```

Send a test to yourself first, check it, then send for real.

## Writing an announcement

One file per announcement in `content/announcements/`. The type is in
[`content/types.ts`](content/types.ts):

```ts
export default defineAnnouncement({
  slug: "gasless-swaps",          // must match the filename
  label: "New feature",            // optional eyebrow tag
  title: "Gasless swaps are here", // subject line and headline
  preview: "Swap without holding native gas.", // inbox preview text
  summary: [                       // body paragraphs
    "First paragraph.",
    "Second paragraph.",
  ],
  highlights: [                    // optional bullet list
    "No native gas token needed",
  ],
  changelogUrl: "https://docs.near-intents.org/changelog/gasless-swaps",
  cta: "Read the docs",            // optional button label
});
```

Write the gist in the email. Keep the detail in the docs and link to it with `changelogUrl`.

## Branding

Colors, logo, and footer are in [`emails/brand.ts`](emails/brand.ts). Change them and the
emails follow. The logo is an SVG served through an image CDN, which renders in Gmail. Some
stricter clients (e.g. Outlook) may not show SVG, so swap in a hosted PNG if that matters.

## Project layout

```
emails/            branded template (AnnouncementEmail.tsx) + brand tokens (brand.ts)
content/           announcement files + the Announcement type
src/app/           the /compose page and API routes
src/lib/           in-memory subscriber store, importSource (API stub), mailer (Gmail), send, render
scripts/           send and contacts CLIs
```

## Deploy

Push to GitHub and import into Vercel. Set the same env vars in the project settings. You
get a permanent URL at `/compose` to manage recipients and send.

Two things to handle before a public deploy:

- The admin area has no login. Put `/compose` and the `/api/subscribers` routes behind auth.
- The store is in-memory, so it resets on restart (and, on serverless, is not shared across
  instances). That's fine when you re-import from your API on each session; if you need the
  list to persist, replace the `store` array in `src/lib/subscribers.ts` with a database
  (Neon Postgres or Vercel KV). The exported functions are the interface; callers don't change.
```
