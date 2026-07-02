import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { databaseUrl } from "./url";

let cached: ReturnType<typeof drizzle> | null = null;

/** Drizzle client over the Neon HTTP driver (serverless-safe). */
export function db() {
  if (!cached) cached = drizzle(neon(databaseUrl()), { schema });
  return cached;
}
