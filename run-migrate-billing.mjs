import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log("Starting PayMongo billing migration...");

  // Create subscription_status enum
  try {
    await sql.unsafe(
      `CREATE TYPE "subscription_status" AS ENUM ('active', 'cancelled', 'past_due', 'paused', 'trialing', 'expired')`
    );
    console.log("OK: Created subscription_status enum");
  } catch (err) {
    console.log("SKIP subscription_status enum:", err.message);
  }

  // Create payment_status enum
  try {
    await sql.unsafe(
      `CREATE TYPE "payment_status" AS ENUM ('paid', 'pending', 'failed', 'refunded')`
    );
    console.log("OK: Created payment_status enum");
  } catch (err) {
    console.log("SKIP payment_status enum:", err.message);
  }

  // Create billing_interval enum
  try {
    await sql.unsafe(
      `CREATE TYPE "billing_interval" AS ENUM ('monthly', 'yearly')`
    );
    console.log("OK: Created billing_interval enum");
  } catch (err) {
    console.log("SKIP billing_interval enum:", err.message);
  }

  // Create subscription_plans table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "subscription_plans" (
      "id" serial PRIMARY KEY,
      "name" varchar(128) NOT NULL,
      "slug" varchar(64) NOT NULL UNIQUE,
      "price" numeric(10, 2) NOT NULL,
      "currency" varchar(3) NOT NULL DEFAULT 'PHP',
      "interval" "billing_interval" NOT NULL DEFAULT 'monthly',
      "features" json NOT NULL DEFAULT '[]',
      "paymongoLinkId" varchar(255),
      "isActive" boolean NOT NULL DEFAULT true,
      "sortOrder" integer NOT NULL DEFAULT 0,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log("OK: Created subscription_plans table");

  // Create user_subscriptions table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "user_subscriptions" (
      "id" serial PRIMARY KEY,
      "userId" integer NOT NULL,
      "planId" integer NOT NULL,
      "status" "subscription_status" NOT NULL DEFAULT 'active',
      "paymongoSubscriptionId" varchar(255),
      "paymongoCheckoutId" varchar(255),
      "currentPeriodStart" timestamp,
      "currentPeriodEnd" timestamp,
      "cancelledAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log("OK: Created user_subscriptions table");

  // Create payment_history table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "payment_history" (
      "id" serial PRIMARY KEY,
      "userId" integer NOT NULL,
      "subscriptionId" integer,
      "amount" numeric(10, 2) NOT NULL,
      "currency" varchar(3) NOT NULL DEFAULT 'PHP',
      "status" "payment_status" NOT NULL DEFAULT 'pending',
      "paymongoPaymentId" varchar(255),
      "paymongoCheckoutId" varchar(255),
      "description" text,
      "paidAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log("OK: Created payment_history table");

  // Add plan column to users table if it doesn't exist
  try {
    await sql.unsafe(
      `ALTER TABLE "users" ADD COLUMN "plan" varchar(64) DEFAULT 'starter'`
    );
    console.log("OK: Added plan column to users table");
  } catch (err) {
    console.log("SKIP plan column:", err.message);
  }

  console.log("✅ PayMongo billing migration complete!");
} catch (err) {
  console.error("❌ Migration failed:", err);
  process.exit(1);
} finally {
  await sql.end();
}
