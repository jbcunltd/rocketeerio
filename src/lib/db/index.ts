import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Required for some serverless edge runtimes; harmless in Node.
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Don't throw at import time during `next build` — only when actually used.
  console.warn(
    "[db] DATABASE_URL is not set. Database calls will fail at runtime.",
  );
}

const sql = neon(connectionString ?? "postgres://invalid", {
  // prepare: false equivalent for neon-http (no prepared statements over HTTP).
  // Drizzle's neon-http driver already runs over HTTP without server-side
  // prepared statements, so explicit setting is unnecessary, but we keep
  // a single source of truth here for future swap-outs.
});

export const db = drizzle(sql, { schema });
export * as tables from "./schema";
