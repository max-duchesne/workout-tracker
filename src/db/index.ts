import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization so importing this module never touches DATABASE_URL at
// build time (Next.js evaluates top-level module code during `next build`).
// A plain function is used deliberately — do NOT wrap in a Proxy, which breaks
// libraries that introspect the client.
function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
