import postgres from "postgres";
import type { LiveConversation, QualificationStatus } from "@/lib/josh-live-inbox-types";

type LiveInboxLoadResult = {
  conversations: LiveConversation[];
  unavailable: boolean;
};

type RawConversationRow = {
  sender_psid: string;
  conversation_id: number | null;
  contact_id: number | null;
  total_messages: number | string;
  inbound_messages: number | string;
  outbound_messages: number | string;
  latest_content: string | null;
  latest_direction: "inbound" | "outbound" | null;
  latest_at: Date | string | null;
  last_inbound_at: Date | string | null;
  last_outbound_at: Date | string | null;
  qualification_score: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | null;
  qualification_data: unknown;
  ai_enabled: boolean | null;
  ai_turns: number | string | null;
};

type MetaUserProfile = {
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
};

declare global {
  var __rocketeerioLiveInboxSql: postgres.Sql | undefined;
  var __rocketeerioLiveInboxSqlUrl: string | undefined;
  var __rocketeerioProfileCache: Map<string, MetaUserProfile> | undefined;
}

function getLiveInboxSql() {
  const databaseUrl = getLiveInboxDatabaseUrl();
  if (!databaseUrl) return null;

  if (!globalThis.__rocketeerioLiveInboxSql || globalThis.__rocketeerioLiveInboxSqlUrl !== databaseUrl) {
    globalThis.__rocketeerioLiveInboxSql = postgres(databaseUrl, {
      max: 2,
      prepare: false,
      ssl: shouldUseSsl(databaseUrl) ? "require" : undefined,
      idle_timeout: 20,
    });
    globalThis.__rocketeerioLiveInboxSqlUrl = databaseUrl;
  }

  return globalThis.__rocketeerioLiveInboxSql;
}

function getLiveInboxDatabaseUrl() {
  return (
    process.env.ROCKETEERIO_MIDDLEWARE_DATABASE_URL ??
    process.env.LIVE_INBOX_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function shouldUseSsl(url: string) {
  return !/localhost|127\.0\.0\.1|::1/.test(url);
}

/**
 * Fetch user profile (name + avatar) from Meta Graph API using the page access token.
 * Results are cached in-memory to avoid repeated API calls for the same PSID.
 */
async function fetchMetaUserProfile(
  psid: string,
  pageAccessToken: string,
): Promise<MetaUserProfile> {
  // Initialize cache if needed
  if (!globalThis.__rocketeerioProfileCache) {
    globalThis.__rocketeerioProfileCache = new Map();
  }

  // Return cached result if available
  const cached = globalThis.__rocketeerioProfileCache.get(psid);
  if (cached) return cached;

  // Skip non-numeric PSIDs (test/smoke data)
  if (!/^\d+$/.test(psid)) {
    const empty: MetaUserProfile = {};
    globalThis.__rocketeerioProfileCache.set(psid, empty);
    return empty;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      const empty: MetaUserProfile = {};
      globalThis.__rocketeerioProfileCache.set(psid, empty);
      return empty;
    }

    const data = await res.json();
    const profile: MetaUserProfile = {
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      profile_pic: data.profile_pic || undefined,
    };

    globalThis.__rocketeerioProfileCache.set(psid, profile);
    return profile;
  } catch {
    // On any error (timeout, network), return empty and cache it briefly
    const empty: MetaUserProfile = {};
    globalThis.__rocketeerioProfileCache.set(psid, empty);
    return empty;
  }
}

/**
 * Get the page access token from the pages table for a given page_id.
 */
async function getPageAccessToken(
  sql: postgres.Sql,
  pageId: string,
): Promise<string | null> {
  try {
    const rows = await sql<{ page_access_token: string | null }[]>`
      SELECT page_access_token FROM pages WHERE page_id = ${pageId} LIMIT 1
    `;
    return rows[0]?.page_access_token ?? null;
  } catch {
    return null;
  }
}

export async function loadLiveInboxConversations(
  pageId: string | null,
  limit = 100,
): Promise<LiveInboxLoadResult> {
  const sql = getLiveInboxSql();
  if (!pageId || !sql) {
    return { conversations: [], unavailable: !sql };
  }

  try {
    const rows = await sql<RawConversationRow[]>`
      WITH message_rows AS (
        SELECT
          id,
          page_id,
          sender_psid,
          direction,
          content,
          COALESCE(timestamp, created_at) AS message_at
        FROM messages
        WHERE page_id = ${pageId}
          AND NULLIF(BTRIM(COALESCE(content, '')), '') IS NOT NULL
      ),
      latest_messages AS (
        SELECT DISTINCT ON (page_id, sender_psid)
          page_id,
          sender_psid,
          direction AS latest_direction,
          content AS latest_content,
          message_at AS latest_at
        FROM message_rows
        ORDER BY page_id, sender_psid, message_at DESC, id DESC
      ),
      message_rollups AS (
        SELECT
          page_id,
          sender_psid,
          COUNT(*)::int AS total_messages,
          COUNT(*) FILTER (WHERE direction = 'inbound')::int AS inbound_messages,
          COUNT(*) FILTER (WHERE direction = 'outbound')::int AS outbound_messages,
          MAX(message_at) FILTER (WHERE direction = 'inbound') AS last_inbound_at,
          MAX(message_at) FILTER (WHERE direction = 'outbound') AS last_outbound_at
        FROM message_rows
        GROUP BY page_id, sender_psid
      ),
      latest_state AS (
        SELECT DISTINCT ON (page_id, psid)
          page_id,
          psid,
          conversation_id,
          contact_id,
          qualification_score,
          qualification_data,
          ai_enabled,
          ai_turns,
          updated_at
        FROM conversation_state
        WHERE page_id = ${pageId}
        ORDER BY page_id, psid, updated_at DESC NULLS LAST, conversation_id DESC NULLS LAST
      )
      SELECT
        r.sender_psid,
        s.conversation_id,
        s.contact_id,
        r.total_messages,
        r.inbound_messages,
        r.outbound_messages,
        l.latest_content,
        l.latest_direction,
        l.latest_at,
        r.last_inbound_at,
        r.last_outbound_at,
        s.qualification_score,
        s.qualification_data,
        s.ai_enabled,
        s.ai_turns
      FROM message_rollups r
      JOIN latest_messages l
        ON l.page_id = r.page_id
       AND l.sender_psid = r.sender_psid
      LEFT JOIN latest_state s
        ON s.page_id = r.page_id
       AND s.psid = r.sender_psid
      ORDER BY l.latest_at DESC
      LIMIT ${limit}
    `;

    // Fetch the page access token to resolve lead names from Meta
    const pageAccessToken = await getPageAccessToken(sql, pageId);

    // Resolve names for all conversations in parallel
    const profilePromises = rows.map((row) =>
      pageAccessToken
        ? fetchMetaUserProfile(row.sender_psid, pageAccessToken)
        : Promise.resolve({} as MetaUserProfile),
    );
    const profiles = await Promise.all(profilePromises);

    return {
      conversations: rows.map((row, i) => mapConversationRow(row, profiles[i])),
      unavailable: false,
    };
  } catch (error) {
    console.error("[josh inbox] live conversation load failed", error);
    return { conversations: [], unavailable: true };
  }
}

function mapConversationRow(row: RawConversationRow, profile?: MetaUserProfile): LiveConversation {
  const qualificationStatus = mapQualificationStatus(row);
  const isHot = isHotLead(row, qualificationStatus);
  const latestAt = toDate(row.latest_at);

  // Resolve lead name: prefer Meta profile name, then contact ID, then PSID fallback
  let leadName: string;
  if (profile?.first_name) {
    leadName = profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name;
  } else if (row.contact_id) {
    leadName = `Contact #${row.contact_id}`;
  } else if (/^\d+$/.test(row.sender_psid)) {
    leadName = `Messenger lead ${lastDigits(row.sender_psid)}`;
  } else {
    // Test/smoke data — show as-is but cleaned up
    leadName = `Test: ${row.sender_psid.slice(0, 20)}`;
  }

  return {
    id: row.conversation_id ? String(row.conversation_id) : `${row.sender_psid}`,
    leadName,
    leadAvatarUrl: profile?.profile_pic ?? null,
    lastMessagePreview: buildPreview(row.latest_content, row.latest_direction),
    timestampLabel: formatTimestampLabel(latestAt),
    qualificationStatus,
    isHot,
    leadTemperature: isHot ? "Hot" : qualificationStatus === "Qualifying" ? "Warm" : "Cold",
  };
}

function mapQualificationStatus(row: RawConversationRow): QualificationStatus {
  if (row.qualification_score === "HIGH") return "Qualified";
  if (row.qualification_score === "MEDIUM") return "Qualifying";
  if (row.qualification_score === "LOW") return "Unqualified";

  const inbound = Number(row.inbound_messages ?? 0);
  const outbound = Number(row.outbound_messages ?? 0);
  if (inbound > 0 && outbound > 0) return "Qualifying";
  return "New";
}

function isHotLead(row: RawConversationRow, status: QualificationStatus) {
  if (row.qualification_score === "HIGH" || status === "Qualified") return true;

  const data = isRecord(row.qualification_data) ? row.qualification_data : {};
  const serializedData = JSON.stringify(data).toLowerCase();
  const latestContent = (row.latest_content ?? "").toLowerCase();
  const hotSignals = /\b(price|pricing|rate|rates|budget|available|availability|book|booking|reserve|reservation|schedule|visit|ocular|call|event date|wedding|debut|corporate|quote|package)\b/;

  return hotSignals.test(latestContent) || hotSignals.test(serializedData);
}

function buildPreview(content: string | null, direction: RawConversationRow["latest_direction"]) {
  const trimmed = (content ?? "").trim();
  if (!trimmed) return "No message preview available.";
  const prefix = direction === "outbound" ? "Josh: " : "";
  return `${prefix}${trimmed}`;
}

function formatTimestampLabel(value: Date | null) {
  if (!value) return "—";

  const now = Date.now();
  const diffMs = Math.max(0, now - value.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d`;

  return value.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function toDate(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function lastDigits(value: string) {
  return value.slice(-6) || "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
