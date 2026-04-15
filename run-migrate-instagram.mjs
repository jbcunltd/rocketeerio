import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log("Connected to database");

  // Create platform enum if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE platform AS ENUM ('messenger', 'instagram');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("✓ platform enum created");

  // Create instagram_accounts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS instagram_accounts (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "facebookPageId" INTEGER,
      "igUserId" VARCHAR(128) NOT NULL UNIQUE,
      "igUsername" VARCHAR(255) NOT NULL,
      "igName" VARCHAR(255),
      "profilePicUrl" TEXT,
      "followerCount" INTEGER DEFAULT 0,
      "pageAccessToken" TEXT,
      "isActive" BOOLEAN DEFAULT true NOT NULL,
      "aiMode" ai_mode DEFAULT 'testing' NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
  console.log("✓ instagram_accounts table created");

  // Add platform and igScopedId columns to leads if not exist
  await client.query(`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS platform VARCHAR(32) DEFAULT 'messenger';
  `);
  await client.query(`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "igScopedId" VARCHAR(128);
  `);
  console.log("✓ leads table updated with platform and igScopedId columns");

  // Add platform column to conversations if not exist
  await client.query(`
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS platform VARCHAR(32) DEFAULT 'messenger';
  `);
  console.log("✓ conversations table updated with platform column");

  await client.end();
  console.log("✅ Instagram migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
