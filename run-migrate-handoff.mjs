import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  // Add handoff columns to conversations table
  const columns = [
    { name: "needsHandoff", sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "needsHandoff" BOOLEAN DEFAULT false NOT NULL` },
    { name: "handoffReason", sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "handoffReason" TEXT` },
    { name: "handoffAt", sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "handoffAt" TIMESTAMP` },
    { name: "assignedTo", sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "assignedTo" INTEGER` },
  ];

  for (const col of columns) {
    await client.query(col.sql);
    console.log(`✓ Added ${col.name} column`);
  }

  await client.end();
  console.log("✅ Handoff migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
