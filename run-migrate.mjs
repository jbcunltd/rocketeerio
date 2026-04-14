import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  // Add 'file' to kb_source enum
  try {
    await sql.unsafe(`ALTER TYPE "kb_source" ADD VALUE IF NOT EXISTS 'file'`);
    console.log("OK: Added 'file' to kb_source enum");
  } catch (err) {
    console.log("SKIP kb_source:", err.message);
  }

  // Create ai_tone enum
  try {
    await sql.unsafe(`CREATE TYPE "ai_tone" AS ENUM ('casual_taglish', 'formal_english', 'casual_english', 'professional_filipino')`);
    console.log("OK: Created ai_tone enum");
  } catch (err) {
    console.log("SKIP ai_tone:", err.message);
  }

  // Create ai_response_length enum
  try {
    await sql.unsafe(`CREATE TYPE "ai_response_length" AS ENUM ('short', 'medium', 'detailed')`);
    console.log("OK: Created ai_response_length enum");
  } catch (err) {
    console.log("SKIP ai_response_length:", err.message);
  }

  // Create ai_primary_goal enum
  try {
    await sql.unsafe(`CREATE TYPE "ai_primary_goal" AS ENUM ('site_visit', 'booking', 'quote_request', 'general_support')`);
    console.log("OK: Created ai_primary_goal enum");
  } catch (err) {
    console.log("SKIP ai_primary_goal:", err.message);
  }

  // Create page_ai_settings table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "page_ai_settings" (
      "id" serial PRIMARY KEY,
      "pageId" integer NOT NULL UNIQUE,
      "userId" integer NOT NULL,
      "agentName" varchar(128),
      "tone" "ai_tone" NOT NULL DEFAULT 'casual_taglish',
      "responseLength" "ai_response_length" NOT NULL DEFAULT 'short',
      "useEmojis" boolean NOT NULL DEFAULT true,
      "primaryGoal" "ai_primary_goal" NOT NULL DEFAULT 'site_visit',
      "customInstructions" text,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  console.log("OK: Created page_ai_settings table");

  // Create ai_mode enum
  try {
    await sql.unsafe(`CREATE TYPE "ai_mode" AS ENUM ('paused', 'testing', 'live')`);
    console.log("OK: Created ai_mode enum");
  } catch (err) {
    console.log("SKIP ai_mode:", err.message);
  }

  // Add aiMode column to facebook_pages
  try {
    await sql.unsafe(`ALTER TABLE "facebook_pages" ADD COLUMN "aiMode" "ai_mode" NOT NULL DEFAULT 'testing'`);
    console.log("OK: Added aiMode column to facebook_pages");
  } catch (err) {
    console.log("SKIP aiMode column:", err.message);
  }

  // Create page_testers table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "page_testers" (
      "id" serial PRIMARY KEY,
      "pageId" integer NOT NULL,
      "psid" varchar(128) NOT NULL,
      "label" varchar(255),
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  console.log("OK: Created page_testers table");

  console.log("Migration complete!");
} catch (err) {
  console.error("Migration failed:", err);
} finally {
  await sql.end();
}
