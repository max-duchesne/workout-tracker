import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Google account id (`sub`); the owner key for all app data. */
      id: string;
    } & DefaultSession["user"];
  }
}
