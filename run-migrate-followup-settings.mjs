import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  await client.query(`
    CREATE TABLE IF NOT EXISTS follow_up_settings (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL UNIQUE,
      "isEnabled" BOOLEAN DEFAULT true NOT NULL,
      "step1DelayMinutes" INTEGER DEFAULT 1440 NOT NULL,
      "step1Message" TEXT,
      "step1Enabled" BOOLEAN DEFAULT true NOT NULL,
      "step2DelayMinutes" INTEGER DEFAULT 2880 NOT NULL,
      "step2Message" TEXT,
      "step2Enabled" BOOLEAN DEFAULT true NOT NULL,
      "step3DelayMinutes" INTEGER DEFAULT 10080 NOT NULL,
      "step3Message" TEXT,
      "step3Enabled" BOOLEAN DEFAULT true NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
  console.log("✓ follow_up_settings table created");

  await client.end();
  console.log("✅ Follow-up settings migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
