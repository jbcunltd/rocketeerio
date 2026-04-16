# Facebook Messenger Integration — Setup Guide

## What Was Built

This MVP adds a complete Facebook Messenger integration to Rocketeer, enabling AI-powered lead capture and qualification from Facebook Page messages.

### Features Implemented

| Feature | Description |
|---------|-------------|
| **Facebook OAuth Flow** | Users click "Connect a Page" in Settings, authenticate with Facebook, grant permissions, and all their Pages are auto-connected with webhook subscriptions |
| **Messenger Webhook** | Receives incoming messages from Facebook, routes them to the correct page/conversation, processes them in real-time |
| **AI Response Engine** | Uses GPT (via OpenAI API) to generate contextual replies grounded in the Knowledge Base. Qualifies leads using BANT methodology |
| **Lead Tracking** | Auto-creates leads from Messenger conversations, scores them as Hot/Warm/Cold (0-100), sends notifications for hot leads |
| **Knowledge Base — Website Crawler** | Paste a URL, the system crawls up to 10 pages, extracts content, and uses GPT to structure it into KB entries |
| **Knowledge Base — PDF Upload** | Upload PDF catalogs/brochures (up to 20MB), extract text, and structure into KB entries via GPT |
| **Knowledge Base — Manual Entry** | Add/edit/delete entries manually with category tagging |

### Files Changed/Added

**New files:**
- `server/facebook.ts` — Facebook OAuth flow, webhook handler, Messenger Send API
- `server/website-crawler.ts` — Website crawling + PDF content structuring via GPT
- `server/kb-import.ts` — REST endpoints for website import and PDF upload

**Modified files:**
- `api/index.src.ts` — Registers Facebook and KB import routes
- `api/index.mjs` — Rebuilt serverless bundle
- `drizzle/schema.ts` — Added `kb_source` enum, `source`/`sourceUrl` columns to knowledge_base
- `server/_core/env.ts` — Added Facebook env vars
- `server/db.ts` — Added `getPageByFacebookId`, `getLeadByPsid`, `getConversationByLeadId`, `deleteKnowledgeBySource`
- `client/src/pages/Settings.tsx` — Full Pages tab with Connect/Disconnect/Toggle AI
- `client/src/pages/KnowledgeBase.tsx` — 3 import methods UI with filtering

---

## Deployment Setup

### 1. Environment Variables (Vercel)

Add these environment variables in your Vercel project settings:

```
FACEBOOK_APP_ID=1971848976777445
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
FACEBOOK_VERIFY_TOKEN=rocketeer_verify_token_2024
APP_URL=https://rocketeerio.vercel.app
```

The `OPENAI_API_KEY` and `DATABASE_URL` should already be configured.

### 2. Database Migration

Run the schema push to add the new `kb_source` enum and columns:

```bash
# Option A: Use drizzle-kit push (recommended)
DATABASE_URL="your-connection-string" npx drizzle-kit push

# Option B: Run SQL directly in Supabase SQL Editor
CREATE TYPE kb_source AS ENUM ('manual', 'website', 'pdf');
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source kb_source DEFAULT 'manual' NOT NULL;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS "sourceUrl" text;
```

### 3. Meta Developer Console Setup

Go to [Meta Developer Console](https://developers.facebook.com/apps/1971848976777445/):

**a) Configure Facebook Login:**
1. Go to **Facebook Login > Settings**
2. Add Valid OAuth Redirect URI: `https://rocketeerio.vercel.app/api/auth/facebook/callback`
3. Save Changes

**b) Configure Webhooks:**
1. Go to **Webhooks** (or **Messenger > Settings**)
2. Click **Edit Subscription** (or **Add Callback URL**)
3. Set Callback URL: `https://rocketeerio.vercel.app/api/webhook/facebook`
4. Set Verify Token: `rocketeer_verify_token_2024`
5. Subscribe to fields: `messages`, `messaging_postbacks`

**c) App Permissions:**
1. Go to **App Review > Permissions and Features**
2. Request these permissions (if not already approved):
   - `pages_messaging`
   - `pages_manage_metadata`
   - `pages_read_engagement`

**d) App Mode:**
- For testing with your own account, the app can stay in **Development** mode
- For production with other users, submit for **App Review**

### 4. Test the Integration

1. Go to `https://rocketeerio.vercel.app/settings?tab=pages`
2. Click **Connect a Page**
3. Authenticate with Facebook and grant permissions
4. Your BERCO PH page should appear as connected
5. Go to **Knowledge Base** and import your business info (website or PDF)
6. Send a test message to your BERCO PH Facebook Page from a different account
7. The AI should respond automatically and the conversation should appear in the dashboard

---

## Architecture

```
Facebook User sends message
        ↓
Facebook Platform
        ↓
POST /api/webhook/facebook
        ↓
processIncomingMessage()
  ├── Find/create lead (with FB profile lookup)
  ├── Find/create conversation
  ├── Save incoming message
  ├── Fetch Knowledge Base entries
  ├── Generate AI response (GPT)
  ├── Send reply via Messenger API
  ├── Score lead (BANT: Budget/Authority/Need/Timeline)
  ├── Notify owner if hot lead
  └── Schedule follow-up sequence
```

## Knowledge Base Import Flow

```
Website URL → Crawl pages → Extract text → GPT structures → Save entries
PDF Upload  → Extract text → GPT structures → Save entries
Manual      → User types   → Save entry
```
