import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("[db] DATABASE_URL is not set. Database calls will fail at runtime.");
}

const client = postgres(connectionString ?? "postgres://invalid", {
  prepare: false, // Required for Supabase connection pooler (transaction mode)
});

export const db = drizzle(client, { schema });
export * as tables from "./schema";
