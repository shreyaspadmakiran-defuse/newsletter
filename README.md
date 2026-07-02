# defuse-newsletter

A simple branded email service:

1. People **subscribe** on a small web page → they're added to a **Resend audience**.
2. You author a feature announcement as one small typed file.
3. `pnpm send <slug>` renders a **branded email** and **blasts it to the audience**. The
   email is a short "gist" that links to the full write-up in your **docs changelog**.

No database. Resend holds the subscriber list and handles unsubscribe + compliance.

```
subscribe page ──▶ /api/subscribe ──▶ Resend Audience (your subscriber list)
                                              ▲
content/announcements/<slug>.ts ──render──▶ branded email ──broadcast──┘
        (title, summary, changelogUrl)                    links out to docs changelog
```

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
```

Env vars (see `.env.example`):

| Var | What |
|---|---|
| `RESEND_API_KEY` | From resend.com/api-keys |
| `RESEND_AUDIENCE_ID` | The subscriber list. Create at resend.com/audiences |
| `RESEND_FROM` | Verified sender, e.g. `Defuse Updates <updates@updates.near-intents.org>` |
| `RESEND_REPLY_TO` | Optional reply-to address |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app |

You must **verify your sending domain** in Resend (resend.com/domains) before real sends.

## Run

```bash
pnpm dev          # subscribe page at http://localhost:3000
pnpm email:dev    # preview email templates at http://localhost:3030
```

## Send an announcement

Author `content/announcements/<slug>.ts` (copy the example), then:

```bash
pnpm send <slug> --html out.html          # offline preview, no Resend
pnpm send <slug> --test you@example.com    # send one test email to yourself
pnpm send <slug>                           # create a DRAFT broadcast, print dashboard link
pnpm send <slug> --send                    # blast it to the whole audience
```

Always `--test` yourself first, eyeball it, then `--send`.

## Brand it

Everything visual lives in [`emails/brand.ts`](emails/brand.ts) — colors, logo URL, footer.
Swap those and both the emails and the subscribe page follow. Drop brand assets in
`public/` (or host them) and point `logoUrl` at the absolute URL.

## The changelog link

Each announcement's `changelogUrl` points to the full write-up in your docs. This repo
does **not** host the changelog — it just links out. Point it at your docs site (Mintlify,
etc.). Keep the email a short gist; keep the detail in the docs.
