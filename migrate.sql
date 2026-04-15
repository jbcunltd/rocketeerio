-- Add 'file' to kb_source enum if not already present
DO $$ BEGIN
  ALTER TYPE "kb_source" ADD VALUE IF NOT EXISTS 'file';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create AI personality enums
DO $$ BEGIN
  CREATE TYPE "ai_tone" AS ENUM ('casual_taglish', 'formal_english', 'casual_english', 'professional_filipino');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ai_response_length" AS ENUM ('short', 'medium', 'detailed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ai_primary_goal" AS ENUM ('site_visit', 'booking', 'quote_request', 'general_support');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create page_ai_settings table
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
);

-- Create ai_mode enum for page AI mode (paused / testing / live)
DO $$ BEGIN
  CREATE TYPE "ai_mode" AS ENUM ('paused', 'testing', 'live');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add aiMode column to facebook_pages (default to 'testing')
DO $$ BEGIN
  ALTER TABLE "facebook_pages" ADD COLUMN "aiMode" "ai_mode" NOT NULL DEFAULT 'testing';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create page_testers table for managing tester accounts per page
CREATE TABLE IF NOT EXISTS "page_testers" (
  "id" serial PRIMARY KEY,
  "pageId" integer NOT NULL,
  "psid" varchar(128) NOT NULL,
  "label" varchar(255),
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════
-- Plan Enforcement System Migration
-- ═══════════════════════════════════════════════════════════════════

-- Add new plan enum values (free, pro, custom) if not already present
DO $$ BEGIN
  ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'free';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'pro';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update existing 'starter' plan users to 'free'
-- Note: This requires the enum to already have 'free' value
UPDATE "users" SET "plan" = 'free' WHERE "plan" = 'starter';

-- Set default plan to 'free' for users table
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free';

-- ═══════════════════════════════════════════════════════════════════
-- Hot Lead Alerts — Notification Preferences Expansion
-- ═══════════════════════════════════════════════════════════════════

-- Create alert_threshold enum
DO $$ BEGIN
  CREATE TYPE "alert_threshold" AS ENUM ('hot', 'warm', 'all');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new hot lead alert columns to notification_preferences
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "alertThreshold" "alert_threshold" NOT NULL DEFAULT 'hot';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "whatsappEnabled" boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "whatsappNumber" varchar(32);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "telegramEnabled" boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "telegramChatId" varchar(128);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "messengerEnabled" boolean NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "alertSmsEnabled" boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "alertSmsNumber" varchar(32);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "alertEmailEnabled" boolean NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD COLUMN "alertEmailAddress" varchar(320);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
