import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't auto-load .env.local (only Next.js does), so load it here.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer the direct (unpooled) connection for DDL/migrations.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
