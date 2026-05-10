import postgres from "postgres";
import type {
  LiveConversation,
  LiveConversationMessage,
  MessageDirection,
  QualificationStatus,
  StructuredLeadDecision,
  StructuredQualificationFields,
} from "@/lib/josh-live-inbox-types";

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
  messages: unknown;
};

type AgentDecisionColumn = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

type AgentDecisionRow = {
  sender_psid: string;
  decision_data: unknown;
  decision_at: Date | string | null;
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
  if (!globalThis.__rocketeerioProfileCache) {
    globalThis.__rocketeerioProfileCache = new Map();
  }

  const cached = globalThis.__rocketeerioProfileCache.get(psid);
  if (cached) return cached;

  if (!/^\d+$/.test(psid)) {
    const empty: MetaUserProfile = {};
    globalThis.__rocketeerioProfileCache.set(psid, empty);
    return empty;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn("[josh inbox] Meta profile lookup failed", {
        psid: maskPsid(psid),
        status: res.status,
        statusText: res.statusText,
        body: errorText.slice(0, 300),
      });
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
  } catch (error) {
    console.warn("[josh inbox] Meta profile lookup error", {
      psid: maskPsid(psid),
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

async function getPageAccessToken(
  sql: postgres.Sql,
  pageId: string,
): Promise<string | null> {
  try {
    const rows = await sql<{ page_access_token: string | null }[]>`
      SELECT page_access_token FROM pages WHERE page_id = ${pageId} LIMIT 1
    `;
    const token = rows[0]?.page_access_token ?? null;
    console.info("[josh inbox] page access token lookup", {
      pageId,
      found: Boolean(token),
    });
    return token;
  } catch (error) {
    console.error("[josh inbox] page access token lookup failed", {
      pageId,
      error: error instanceof Error ? error.message : String(error),
    });
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
      message_threads AS (
        SELECT
          page_id,
          sender_psid,
          jsonb_agg(
            jsonb_build_object(
              'id', id::text,
              'direction', direction,
              'content', content,
              'timestamp', message_at
            )
            ORDER BY message_at ASC, id ASC
          ) AS messages
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
        s.ai_turns,
        COALESCE(t.messages, '[]'::jsonb) AS messages
      FROM message_rollups r
      JOIN latest_messages l
        ON l.page_id = r.page_id
       AND l.sender_psid = r.sender_psid
      LEFT JOIN message_threads t
        ON t.page_id = r.page_id
       AND t.sender_psid = r.sender_psid
      LEFT JOIN latest_state s
        ON s.page_id = r.page_id
       AND s.psid = r.sender_psid
      ORDER BY l.latest_at DESC
      LIMIT ${limit}
    `;

    const psids = rows.map((row) => row.sender_psid);
    const decisionsByPsid = await loadLatestAgentDecisions(sql, pageId, psids);
    let profiles: MetaUserProfile[] = rows.map(() => ({}));

    try {
      const pageAccessToken = await getPageAccessToken(sql, pageId);

      if (!pageAccessToken) {
        console.warn("[josh inbox] no page access token available for Meta profile lookup", {
          pageId,
        });
      } else {
        profiles = await Promise.all(
          rows.map((row) => fetchMetaUserProfile(row.sender_psid, pageAccessToken)),
        );
      }
    } catch (error) {
      console.error("[josh inbox] profile resolution failed; using PSID/contact fallbacks", {
        pageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      conversations: rows.map((row, i) =>
        mapConversationRow(row, profiles[i], decisionsByPsid.get(row.sender_psid) ?? null),
      ),
      unavailable: false,
    };
  } catch (error) {
    console.error("[josh inbox] live conversation load failed", error);
    return { conversations: [], unavailable: true };
  }
}

async function loadLatestAgentDecisions(
  sql: postgres.Sql,
  pageId: string,
  psids: string[],
): Promise<Map<string, StructuredLeadDecision>> {
  const decisions = new Map<string, StructuredLeadDecision>();
  if (psids.length === 0) return decisions;

  try {
    const columns = await sql<AgentDecisionColumn[]>`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'agent_decisions'
    `;

    if (columns.length === 0) {
      console.warn("[josh inbox] agent_decisions table not found; profile decisions unavailable");
      return decisions;
    }

    const columnNames = new Set(columns.map((column) => column.column_name));
    const pageColumn = pickColumn(columnNames, ["page_id", "pageId", "facebook_page_id"]);
    const psidColumn = pickColumn(columnNames, ["sender_psid", "psid", "lead_psid", "recipient_psid", "contact_psid"]);
    const updatedColumn = pickColumn(columnNames, ["updated_at", "created_at", "decision_at", "timestamp"]);
    const idColumn = pickColumn(columnNames, ["id"]);

    if (!psidColumn) {
      console.warn("[josh inbox] agent_decisions table has no recognized PSID column", {
        columns: [...columnNames],
      });
      return decisions;
    }

    const pagePredicate = pageColumn
      ? `AND ${quoteIdent(pageColumn)}::text = $1`
      : "";
    const psidParamIndex = pageColumn ? 2 : 1;
    const selectedTimestamp = updatedColumn ? quoteIdent(updatedColumn) : "NULL";
    const distinctColumns = pageColumn
      ? `${quoteIdent(pageColumn)}::text, ${quoteIdent(psidColumn)}::text`
      : `${quoteIdent(psidColumn)}::text`;
    const orderColumns = [
      pageColumn ? `${quoteIdent(pageColumn)}::text` : null,
      `${quoteIdent(psidColumn)}::text`,
      updatedColumn ? `${quoteIdent(updatedColumn)} DESC NULLS LAST` : null,
      idColumn ? `${quoteIdent(idColumn)} DESC` : null,
    ].filter(Boolean).join(", ");
    const query = `
      SELECT DISTINCT ON (${distinctColumns})
        ${quoteIdent(psidColumn)}::text AS sender_psid,
        to_jsonb(agent_decisions) AS decision_data,
        ${selectedTimestamp} AS decision_at
      FROM agent_decisions
      WHERE ${quoteIdent(psidColumn)}::text = ANY($${psidParamIndex}::text[])
        ${pagePredicate}
      ORDER BY ${orderColumns}
    `;
    const params = pageColumn ? [pageId, psids] : [psids];
    const rows = await sql.unsafe<AgentDecisionRow[]>(query, params);

    for (const row of rows) {
      const decision = normalizeAgentDecision(row.decision_data, row.decision_at);
      if (decision) decisions.set(row.sender_psid, decision);
    }
  } catch (error) {
    console.error("[josh inbox] structured decision load failed", error);
  }

  return decisions;
}

function mapConversationRow(
  row: RawConversationRow,
  profile?: MetaUserProfile,
  decision?: StructuredLeadDecision | null,
): LiveConversation {
  const qualificationStatus = mapQualificationStatus(row, decision);
  const isHot = isHotLead(row, qualificationStatus, decision);
  const latestAt = toDate(row.latest_at);
  const leadTemperature = mapLeadTemperature(qualificationStatus, decision, isHot);

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
    leadName = `Test: ${row.sender_psid.slice(0, 20)}`;
  }

  return {
    id: row.conversation_id ? String(row.conversation_id) : `${row.sender_psid}`,
    leadPsid: row.sender_psid,
    leadName,
    leadAvatarUrl: profile?.profile_pic ?? null,
    lastMessagePreview: buildPreview(row.latest_content, row.latest_direction),
    timestampLabel: formatTimestampLabel(latestAt),
    qualificationStatus,
    isHot,
    leadTemperature,
    messages: mapThreadMessages(row.messages),
    decision: decision ?? null,
  };
}

function mapThreadMessages(value: unknown): LiveConversationMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): LiveConversationMessage | null => {
      if (!isRecord(item)) return null;
      const direction = normalizeDirection(item.direction);
      const content = asString(item.content)?.trim();
      if (!direction || !content) return null;
      const timestamp = toDate(item.timestamp as Date | string | null);

      return {
        id: asString(item.id) ?? `${direction}-${timestamp?.toISOString() ?? Math.random().toString(36).slice(2)}`,
        direction,
        content,
        timestampLabel: formatTimestampLabel(timestamp),
        timestampIso: timestamp?.toISOString() ?? null,
      };
    })
    .filter((message): message is LiveConversationMessage => Boolean(message));
}

function normalizeDirection(value: unknown): MessageDirection | null {
  return value === "inbound" || value === "outbound" ? value : null;
}

function mapQualificationStatus(
  row: RawConversationRow,
  decision?: StructuredLeadDecision | null,
): QualificationStatus {
  const stage = normalizeStage(decision?.leadStage);
  const confidence = decision?.confidence ?? null;

  if (stage && /qualified|ready|booked|closed/.test(stage)) return "Qualified";
  if (stage && /unqualified|disqualified|lost/.test(stage)) return "Unqualified";
  if (typeof confidence === "number" && confidence >= 0.75) return "Qualified";
  if (typeof confidence === "number" && confidence >= 0.35) return "Qualifying";

  if (row.qualification_score === "HIGH") return "Qualified";
  if (row.qualification_score === "MEDIUM") return "Qualifying";
  if (row.qualification_score === "LOW") return "Unqualified";

  const inbound = Number(row.inbound_messages ?? 0);
  const outbound = Number(row.outbound_messages ?? 0);
  if (inbound > 0 && outbound > 0) return "Qualifying";
  return "New";
}

function isHotLead(
  row: RawConversationRow,
  status: QualificationStatus,
  decision?: StructuredLeadDecision | null,
) {
  if (status === "Qualified") return true;
  if (typeof decision?.confidence === "number" && decision.confidence >= 0.7) return true;
  if (decision?.ownerAlert) return true;

  const structuredData = JSON.stringify({
    decision,
    qualificationData: isRecord(row.qualification_data) ? row.qualification_data : {},
  }).toLowerCase();
  const latestContent = (row.latest_content ?? "").toLowerCase();
  const hotSignals = /\b(price|pricing|rate|rates|budget|available|availability|book|booking|reserve|reservation|schedule|visit|ocular|call|event date|wedding|debut|corporate|quote|package)\b/;

  return hotSignals.test(latestContent) || hotSignals.test(structuredData);
}

function mapLeadTemperature(
  status: QualificationStatus,
  decision: StructuredLeadDecision | null | undefined,
  isHot: boolean,
) {
  if (isHot || status === "Qualified") return "Hot";
  if (status === "Qualifying") return "Warm";
  if (typeof decision?.confidence === "number" && decision.confidence >= 0.35) return "Warm";
  return "Cold";
}

function normalizeAgentDecision(value: unknown, decisionAt: Date | string | null): StructuredLeadDecision | null {
  const row = isRecord(value) ? value : null;
  if (!row) return null;
  const source = extractDecisionSource(row);
  if (!source) return null;

  const qualificationFields = normalizeQualificationFields(
    firstRecord(source, ["qualification_fields", "qualificationFields", "fields", "lead_profile", "leadProfile"]),
    source,
  );
  const confidence = normalizeConfidence(firstValue(source, ["confidence", "score", "qualification_score", "qualificationScore"]));
  const decision: StructuredLeadDecision = {
    leadStage: asString(firstValue(source, ["lead_stage", "leadStage", "stage", "status"])),
    confidence,
    qualificationFields,
    missingFields: normalizeStringList(firstValue(source, ["missing_fields", "missingFields", "missing", "missing_qualification_fields"])),
    nextAction: asString(firstValue(source, ["next_action", "nextAction", "action"])),
    ownerAlert: normalizeBoolean(firstValue(source, ["owner_alert", "ownerAlert", "alert_owner", "escalate"])),
    riskFlags: normalizeStringList(firstValue(source, ["risk_flags", "riskFlags", "risks", "flags"])),
    updatedAtLabel: formatTimestampLabel(toDate(decisionAt)),
  };

  const hasUsefulData = Boolean(
    decision.leadStage ||
      decision.confidence !== null ||
      Object.values(decision.qualificationFields).some(Boolean) ||
      decision.missingFields.length > 0 ||
      decision.nextAction ||
      decision.ownerAlert !== null ||
      decision.riskFlags.length > 0,
  );

  return hasUsefulData ? decision : null;
}

function extractDecisionSource(row: Record<string, unknown>) {
  const candidates = [
    "decision",
    "decision_json",
    "structured_decision",
    "structuredDecision",
    "output",
    "result",
    "payload",
    "data",
  ];

  for (const key of candidates) {
    const candidate = row[key];
    if (isRecord(candidate) && looksLikeDecision(candidate)) return candidate;
  }

  if (looksLikeDecision(row)) return row;

  for (const key of candidates) {
    const candidate = row[key];
    if (typeof candidate === "string") {
      try {
        const parsed: unknown = JSON.parse(candidate);
        if (isRecord(parsed) && looksLikeDecision(parsed)) return parsed;
      } catch {
        // Ignore non-JSON text payloads.
      }
    }
  }

  return row;
}

function looksLikeDecision(value: Record<string, unknown>) {
  return [
    "lead_stage",
    "leadStage",
    "qualification_fields",
    "qualificationFields",
    "confidence",
    "missing_fields",
    "missingFields",
    "next_action",
    "nextAction",
    "owner_alert",
    "ownerAlert",
    "risk_flags",
    "riskFlags",
  ].some((key) => key in value);
}

function normalizeQualificationFields(
  nested: Record<string, unknown> | null,
  source: Record<string, unknown>,
): StructuredQualificationFields {
  const read = (keys: string[]) => asString(firstValue(nested ?? source, keys));
  return {
    budget: read(["budget"]),
    authority: read(["authority", "decision_maker", "decisionMaker"]),
    need: read(["need", "use_case", "useCase", "reason"]),
    timeline: read(["timeline", "event_date", "eventDate", "date"]),
    location: read(["location", "venue", "city", "area"]),
  };
}

function firstRecord(source: Record<string, unknown>, keys: string[]) {
  const value = firstValue(source, keys);
  return isRecord(value) ? value : null;
}

function firstValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in source) return source[key];
  }
  return null;
}

function normalizeConfidence(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1 && value <= 100 ? value / 100 : clamp(value, 0, 1);
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    if (Number.isFinite(parsed)) return parsed > 1 ? clamp(parsed / 100, 0, 1) : clamp(parsed, 0, 1);
  }
  return null;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return null;
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)?.trim()).filter((item): item is string => Boolean(item));
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeStage(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? null;
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

function maskPsid(value: string) {
  if (value.length <= 6) return "******";
  return `…${value.slice(-6)}`;
}

function pickColumn(columnNames: Set<string>, candidates: string[]) {
  return candidates.find((candidate) => columnNames.has(candidate)) ?? null;
}

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function asString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
