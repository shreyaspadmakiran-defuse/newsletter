import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = "defuse.org";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // works behind Vercel / localhost without setting AUTH_URL
  providers: [Google], // reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
  pages: { signIn: "/signin" },
  callbacks: {
    // Only allow verified @defuse.org Google Workspace accounts.
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? "";
      const verified = profile?.email_verified !== false;
      return verified && email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
  },
});
