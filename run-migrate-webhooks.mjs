import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT,
      events TEXT[] NOT NULL,
      "isActive" BOOLEAN DEFAULT true NOT NULL,
      "lastTriggeredAt" TIMESTAMP,
      "failCount" INTEGER DEFAULT 0 NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
  console.log("✓ webhook_endpoints table created");

  await client.end();
  console.log("✅ Webhooks migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
