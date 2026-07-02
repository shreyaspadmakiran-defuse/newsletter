# defuse-newsletter

A branded email service for product announcements. You keep a list of recipient emails,
write an announcement, and send it as a styled email that links to the full write-up in
your docs changelog.

**Drafts** and the **recipient list** are saved in **Postgres** (Vercel Postgres). You curate
recipients on a `/recipients` page (paste/upload, or wire an API import later). Mail is sent
through your own Gmail account, so there is no third-party sending service and no domain to
verify.

## How it works

```
Recipients (saved list, managed on /recipients):

  paste / upload  ->  POST /api/recipients          \
  external API    ->  POST /api/recipients/import     >-->  Postgres (recipients)

Sending an announcement:

  /compose form  ->  POST /api/send  ->  Gmail (SMTP)  ->  selected recipients
        |                  |
        |                  \--  records recipients + time on the draft (Postgres)
        v
  render with emails/AnnouncementEmail.tsx + emails/brand.ts;
  the email's button links to changelogUrl in your docs
```

Each email carries a one-click `List-Unsubscribe` header pointing at a view-only
`/unsubscribe` page (there's no suppression list — recipients come from your API each time).

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
| `DATABASE_URL` | Postgres connection string (Vercel Postgres exposes `POSTGRES_URL`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client (see Access control) |
| `AUTH_SECRET` | Session secret — `openssl rand -base64 32` |

Gmail limits: ~500 sends/day on personal Gmail, ~2,000 on Workspace.

Then create the tables:

```bash
pnpm db:push        # apply the schema to the database in DATABASE_URL
# pnpm db:studio    # optional: browse the data
```

## Run

```bash
pnpm dev          # app at http://localhost:3000
pnpm email:dev    # template preview at http://localhost:3030
```

- `/compose` — write an announcement, pick recipients, save drafts, and send.
- `/recipients` — manage the saved recipient list (add / paste / upload / remove).
- `/drafts` — every saved draft with its status (Draft / Sent), send time, and recipients.
- `/` redirects to `/compose`.

## Managing recipients

The recipient list is stored in Postgres (`recipients` table) and managed on **`/recipients`**:

- **Paste** one email or many (new lines, commas, or spaces), or **upload** a `.csv` / `.txt`.
- Remove any with the ✕. Adds are idempotent (duplicates are skipped).

On `/compose`, the recipients panel loads this saved list; check who a send goes to (all
selected by default). To wire an external API as the source, see below.

## Importing from an external API

The **Import** button hits `POST /api/recipients/import`, which calls
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
`POST /api/recipients/import` then adds the fetched emails to the saved recipient list
(idempotent). Until wired, that route returns a clear "not configured" error.

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

### From the CLI (content files)

For a version-controlled announcement, write `content/announcements/<slug>.ts` (copy an
existing file), then preview or test it:

```bash
pnpm send <slug> --html out.html          # render to a file, no send
pnpm send <slug> --test you@example.com    # send one test email via Gmail
```

Sending to a recipient list is done in the web app, not the CLI.

## Drafts

`/compose` saves what you've written to Postgres and reloads it later; `/drafts` lists them all.

- **Save draft** stores the current fields (creates a new draft, or updates the loaded one).
- The **Draft** dropdown loads a saved draft into the form. **New** clears it; **Delete**
  removes the selected one.
- Sending marks the draft **sent** and records the recipient list + time. The **`/drafts`**
  page shows each draft's status, when it was sent, and to whom (expandable recipient list).
- Open any draft from `/drafts` via its **Open** button (`/compose?draft=<id>`).

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

## Access control

`/compose`, `/recipients`, `/drafts`, and the admin API routes are gated by **Google sign-in
restricted to `@defuse.org`** (Auth.js). Unauthenticated users are redirected to `/signin`;
non-`defuse.org` accounts are rejected. `/unsubscribe` and `/api/auth/*` stay public.

Set it up with a Google OAuth client (Cloud Console → Credentials → OAuth client ID → Web),
authorized redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://<your-vercel-url>/api/auth/callback/google`

Put its ID/secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, and set `AUTH_SECRET`. The
allowed domain is `defuse.org` in [`src/auth.ts`](src/auth.ts).

## Branding

Colors, logo, and footer are in [`emails/brand.ts`](emails/brand.ts). Change them and the
emails follow. The logo is an SVG served through an image CDN, which renders in Gmail. Some
stricter clients (e.g. Outlook) may not show SVG, so swap in a hosted PNG if that matters.

## Project layout

```
emails/            branded template (AnnouncementEmail.tsx) + brand tokens (brand.ts)
content/           announcement files + the Announcement type
src/db/            Drizzle schema + client (Postgres) — drafts + recipients tables
src/app/           /compose, /recipients, /drafts, /unsubscribe, and API routes
src/lib/           drafts, recipients, importSource (API stub), mailer (Gmail), send, render
scripts/           send CLI (render / test one email)
drizzle/           generated SQL migrations
```

## Deploy

1. Push to GitHub and import the repo into Vercel.
2. Add a **Vercel Postgres** database to the project (Storage tab) — it injects `POSTGRES_URL`,
   which the app reads. Add the Gmail vars and `NEXT_PUBLIC_APP_URL` under Settings → Environment
   Variables.
3. Create the tables: run `pnpm db:push` locally against the same connection string (paste it as
   `DATABASE_URL` in `.env.local`), or apply `drizzle/*.sql` to the database.

You then get a permanent URL at `/compose` to manage recipients, save drafts, and send.

For auth on the deployed URL: add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` to
the Vercel env vars, and add `https://<your-vercel-url>/api/auth/callback/google` to the Google
OAuth client's authorized redirect URIs. Access is limited to `@defuse.org` accounts.
```
