# Rocketeerio Push Notifications

Rocketeerio stores browser push subscriptions in the Next.js database and exposes a secure server route that the Railway Messenger middleware can call when a hot lead sends a message or a new conversation starts.

## Required environment variables

Set these variables in Vercel for the Next.js app. Set the same `PUSH_NOTIFICATION_API_SECRET` in the Railway middleware service so it can authenticate calls to the push endpoint.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel | Public VAPID key returned to authenticated browser clients. |
| `VAPID_PRIVATE_KEY` | Vercel | Server-only private key used by `web-push`. |
| `VAPID_SUBJECT` | Vercel | VAPID contact subject, for example `mailto:hello@rocketeerio.com`. |
| `PUSH_NOTIFICATION_API_SECRET` | Vercel and Railway | Shared bearer token for `POST /api/push/send`. |

## Database migration

The app includes a Drizzle migration that creates `push_subscriptions`. Apply migrations in the same way production database migrations are normally applied for this project before relying on push delivery.

## Browser opt-in flow

Authenticated dashboard users can enable push notifications from `/dashboard/josh-for-sales`. The browser registers `/sw.js`, requests notification permission, subscribes with the configured VAPID public key, and stores the subscription for the selected Facebook Page.

## Railway middleware call

When the Messenger middleware receives a new message from a lead marked **hot** or **qualified**, or when a new conversation starts, call the Next.js endpoint below. The route intentionally skips payloads that are not hot/qualified and not new conversations, so it is safe to call only for eligible events.

```bash
curl -X POST "https://YOUR_VERCEL_DOMAIN/api/push/send" \
  -H "Authorization: Bearer $PUSH_NOTIFICATION_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "FACEBOOK_PAGE_ID",
    "leadName": "Jane Lead",
    "messagePreview": "I want to book a demo this week.",
    "badge": "HOT",
    "isHot": true,
    "isNewConversation": false,
    "qualificationStatus": "Hot",
    "conversationId": "messenger-conversation-id",
    "threadId": "messenger-thread-id"
  }'
```

The response includes delivery counts:

```json
{
  "ok": true,
  "skipped": false,
  "sent": 3,
  "failed": 0,
  "removedExpired": 0,
  "totalSubscriptions": 3
}
```

## Payload contract

| Field | Required | Description |
| --- | --- | --- |
| `pageId` | Yes | Facebook Page ID used to match dashboard subscriptions. |
| `leadName` | Yes | Lead display name shown in the notification title. |
| `messagePreview` | Yes | Short message preview shown in the notification body. |
| `badge` | No | Display badge such as `HOT` or `QUALIFIED`. |
| `isHot` | No | Set `true` for hot leads. |
| `isNewConversation` | No | Set `true` when a new conversation starts. |
| `qualificationStatus` | No | Lead status; `Hot` and `Qualified` trigger delivery. |
| `conversationId` | No | Conversation identifier included in the notification URL. |
| `threadId` | No | Thread identifier included in the notification URL. |
| `imageUrl` | No | Optional notification image URL. |

Notification clicks open `/dashboard/josh-for-sales` and preserve `conversationId` or `threadId` in the query string when provided.
