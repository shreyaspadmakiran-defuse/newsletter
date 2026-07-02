/** Reads a required env var at call time, with a clear error if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example and set it in .env.local.`,
    );
  }
  return value;
}
