// The Vercel Neon integration prefixes its vars (here with "DATABASE_URL_"),
// so there may be no plain DATABASE_URL. Check the common names in order,
// preferring a pooled connection for serverless runtime.
const CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_DATABASE_URL",
  "DATABASE_URL_POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL_POSTGRES_URL_NON_POOLING",
];

export function findDatabaseUrl(): string | undefined {
  for (const key of CANDIDATES) {
    const v = process.env[key];
    if (v && v.length > 0) return v;
  }
  return undefined;
}

export function databaseUrl(): string {
  const url = findDatabaseUrl();
  if (!url) {
    throw new Error(
      "No database URL found. Set DATABASE_URL locally, or add Vercel Postgres/Neon to the project.",
    );
  }
  return url;
}
