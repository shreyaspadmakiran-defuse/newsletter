export const runtime = "nodejs";

// View-only unsubscribe. There's no subscriber store to update; this exists so
// the List-Unsubscribe header points somewhere valid and shows a confirmation.

function page(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;margin:0;padding:64px 16px;color:#18181b">
<div style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:14px;padding:32px;text-align:center">
<div style="height:4px;background:#fb4d01;border-radius:2px;margin:-32px -32px 28px"></div>
<h1 style="font-size:20px;margin:0 0 10px">${title}</h1>
<p style="color:#71717a;font-size:15px;line-height:1.6;margin:0">${body}</p>
</div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email");
  const who = email ? email.replace(/[<>&"]/g, "") : "You";
  return page("You’re unsubscribed", `${who} will no longer receive these emails.`);
}

// One-click unsubscribe (RFC 8058) — Gmail/Yahoo POST here. No-op, returns 200.
export async function POST() {
  return new Response(null, { status: 200 });
}
