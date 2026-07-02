import { defineConfig } from "drizzle-kit";
import { findDatabaseUrl } from "./src/db/url";

// drizzle-kit doesn't auto-load .env.local; do it here.
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    /* absent, fine */
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: findDatabaseUrl() ?? "",
  },
});
