import { Resend } from "resend";
import { requireEnv } from "./env";

/** Shared Resend client. Reads RESEND_API_KEY lazily so imports never crash. */
let client: Resend | null = null;

export function resend(): Resend {
  if (!client) client = new Resend(requireEnv("RESEND_API_KEY"));
  return client;
}
