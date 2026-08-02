import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const isProd = process.env.NODE_ENV === "production";

/**
 * Single-user by design: sign-in with Google, but only the address in
 * ALLOWED_EMAIL is admitted. JWT sessions (no database adapter) — every app row
 * is scoped by the account id (`token.sub`), so opening this up to multiple
 * users later is a policy change, not a migration.
 *
 * In development only, a credentials "Dev sign-in" is added so the app can be
 * driven locally without Google configured. It never loads in production.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    ...(isProd
      ? []
      : [
          Credentials({
            id: "dev",
            name: "Developer",
            credentials: {},
            authorize: async () => ({
              id: "dev-user",
              name: "Dev User",
              email: "dev@localhost",
            }),
          }),
        ]),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      const allowed = process.env.ALLOWED_EMAIL?.toLowerCase().trim();
      if (!allowed) return true; // no allow-list configured (local dev)
      return user.email?.toLowerCase() === allowed;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
