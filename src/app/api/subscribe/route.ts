import { NextResponse } from "next/server";
import { z } from "zod";
import { resend } from "@/lib/resend";
import { requireEnv } from "@/lib/env";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const { error } = await resend().contacts.create({
      email: parsed.data.email,
      audienceId: requireEnv("RESEND_AUDIENCE_ID"),
      unsubscribed: false,
    });

    // Resend returns success even if the contact already exists, so a duplicate
    // signup is a no-op rather than an error — exactly what we want.
    if (error) {
      console.error("[subscribe] Resend error:", error);
      return NextResponse.json({ error: "Could not subscribe. Try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
