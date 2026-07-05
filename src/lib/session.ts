import { auth } from "@/auth";

/**
 * Email of the currently signed-in user, lowercased. Routes are already gated by
 * middleware, so this is normally non-null; callers still guard for safety.
 */
export async function currentUserEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email?.toLowerCase() ?? null;
}
