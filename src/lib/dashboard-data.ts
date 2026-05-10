import { desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { db } from "@/lib/db";
import { facebookPageTable } from "@/lib/db/schema";

export type DashboardConnectedPage = {
  id: number;
  pageId: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
  isActive: boolean;
  connectedAt: Date | string;
};

export type DashboardKpi = {
  value: string;
  sub: string;
};

export type DashboardKpis = {
  conversations24h: DashboardKpi;
  totalContacts: DashboardKpi;
  hotLeads: DashboardKpi;
  qualifiedLeads: DashboardKpi;
  avgResponseTime: DashboardKpi;
  bookedCalls: DashboardKpi;
};

type DashboardPageLoadResult = {
  pages: DashboardConnectedPage[];
  unavailable: boolean;
};

type DashboardKpiLoadResult = {
  kpis: DashboardKpis;
  unavailable: boolean;
};

type MiddlewarePageRow = {
  id: number | string;
  page_id: string;
  page_name: string | null;
  channel: string | null;
  ai_enabled: boolean | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type DashboardConversationMetricRow = {
  sender_psid: string;
  total_messages: number | string | null;
  inbound_messages: number | string | null;
  outbound_messages: number | string | null;
  latest_content: string | null;
  latest_at: Date | string | null;
  qualification_score: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | null;
  qualification_data: unknown;
  first_response_ms: number | string | null;
};

type DashboardMetricSummaryRow = {
  conversations_24h: number | string | null;
  avg_first_response_ms: number | string | null;
  avg_message_response_ms: number | string | null;
};

type MiddlewarePageIdRow = {
  page_id: string;
};

declare global {
  var __rocketeerioDashboardSql: postgres.Sql | undefined;
  var __rocketeerioDashboardSqlUrl: string | undefined;
}

const HOT_SIGNAL_PATTERN =
  "(price|pricing|rate|rates|budget|available|availability|book|booking|reserve|reservation|schedule|visit|ocular|call|event date|wedding|debut|corporate|quote|package)";
const HOT_SIGNAL_REGEX = new RegExp(`\\b${HOT_SIGNAL_PATTERN}\\b`, "i");
const BOOKING_SIGNAL_REGEX =
  /\b(booked|booking confirmed|scheduled|appointment|call booked|reserve|reservation)\b/i;

export async function loadDashboardConnectedPages(
  userId: string,
): Promise<DashboardPageLoadResult> {
  try {
    const drizzlePages = await db
      .select()
      .from(facebookPageTable)
      .where(eq(facebookPageTable.userId, userId))
      .orderBy(desc(facebookPageTable.connectedAt));

    console.info("[dashboard] facebook_pages lookup", {
      userId,
      count: drizzlePages.length,
      pageIds: drizzlePages.map((page) => page.pageId),
    });

    return {
      pages: drizzlePages.map((page) => ({
        id: page.id,
        pageId: page.pageId,
        name: page.name,
        category: page.category,
        pictureUrl: page.pictureUrl,
        isActive: page.isActive,
        connectedAt: page.connectedAt,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.warn(
      "[dashboard] facebook_pages lookup failed; trying middleware pages table",
      error,
    );
  }

  return loadDashboardMiddlewarePages();
}

export async function loadDashboardMiddlewarePages(): Promise<DashboardPageLoadResult> {
  const sql = getDashboardSql();
  if (!sql) return { pages: [], unavailable: true };

  try {
    const rows = await sql<MiddlewarePageRow[]>`
      SELECT
        id,
        page_id,
        page_name,
        channel,
        ai_enabled,
        created_at,
        updated_at
      FROM pages
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    `;

    console.info("[dashboard] middleware pages lookup", {
      count: rows.length,
      pageIds: rows.map((row) => row.page_id),
    });

    return {
      pages: rows.map(mapMiddlewarePageRow),
      unavailable: false,
    };
  } catch (error) {
    console.error("[dashboard] middleware pages lookup failed", error);
    return { pages: [], unavailable: true };
  }
}

export async function loadDashboardKpis(
  pageId: string | null,
): Promise<DashboardKpiLoadResult> {
  if (!pageId) {
    return {
      kpis: buildUnavailableKpis("Connect a Page to start"),
      unavailable: false,
    };
  }

  const sql = getDashboardSql();
  if (!sql) {
    return {
      kpis: buildUnavailableKpis("Database unavailable"),
      unavailable: true,
    };
  }

  try {
    const metricPageId = await resolveDashboardKpiPageId(sql, pageId);
    if (!metricPageId) {
      return {
        kpis: buildUnavailableKpis("No middleware Page found"),
        unavailable: true,
      };
    }

    const [conversationRows, summaryRows] = await Promise.all([
      loadDashboardConversationMetricRows(sql, metricPageId),
      loadDashboardMetricSummary(sql, metricPageId),
    ]);
    const summary = summaryRows[0] ?? null;

    console.info("[dashboard] middleware KPI lookup", {
      requestedPageId: pageId,
      metricPageId,
      conversations24h: summary?.conversations_24h ?? 0,
      totalContacts: conversationRows.length,
      hotLeads: countDashboardHotLeads(conversationRows),
      qualifiedLeads: countDashboardQualifiedLeads(conversationRows),
    });

    return {
      kpis: mapDashboardConversationKpis(conversationRows, summary),
      unavailable: false,
    };
  } catch (error) {
    console.error("[dashboard] KPI load failed", error);
    return {
      kpis: buildUnavailableKpis("Database unavailable"),
      unavailable: true,
    };
  }
}

async function resolveDashboardKpiPageId(
  sql: postgres.Sql,
  requestedPageId: string,
): Promise<string | null> {
  const matchingRows = await sql<MiddlewarePageIdRow[]>`
    SELECT page_id
    FROM pages
    WHERE page_id = ${requestedPageId}
    LIMIT 1
  `;

  const matchingPageId = matchingRows[0]?.page_id ?? null;
  if (matchingPageId) return matchingPageId;

  const fallbackRows = await sql<MiddlewarePageIdRow[]>`
    SELECT page_id
    FROM pages
    WHERE NULLIF(BTRIM(page_id), '') IS NOT NULL
    ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    LIMIT 1
  `;
  const fallbackPageId = fallbackRows[0]?.page_id ?? null;

  if (fallbackPageId) {
    console.warn("[dashboard] requested Page was not found in middleware pages table; using latest middleware Page for KPIs", {
      requestedPageId,
      fallbackPageId,
    });
  }

  return fallbackPageId ?? requestedPageId;
}

async function loadDashboardConversationMetricRows(
  sql: postgres.Sql,
  pageId: string,
): Promise<DashboardConversationMetricRow[]> {
  return sql<DashboardConversationMetricRow[]>`
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
        COUNT(*) FILTER (WHERE direction = 'outbound')::int AS outbound_messages
      FROM message_rows
      GROUP BY page_id, sender_psid
    ),
    latest_state AS (
      SELECT DISTINCT ON (page_id, psid)
        page_id,
        psid,
        qualification_score,
        qualification_data,
        first_response_ms,
        updated_at,
        conversation_id
      FROM conversation_state
      WHERE page_id = ${pageId}
      ORDER BY page_id, psid, updated_at DESC NULLS LAST, conversation_id DESC NULLS LAST
    )
    SELECT
      r.sender_psid,
      r.total_messages,
      r.inbound_messages,
      r.outbound_messages,
      l.latest_content,
      l.latest_at,
      s.qualification_score,
      s.qualification_data,
      s.first_response_ms
    FROM message_rollups r
    JOIN latest_messages l
      ON l.page_id = r.page_id
     AND l.sender_psid = r.sender_psid
    LEFT JOIN latest_state s
      ON s.page_id = r.page_id
     AND s.psid = r.sender_psid
    ORDER BY l.latest_at DESC
  `;
}

async function loadDashboardMetricSummary(
  sql: postgres.Sql,
  pageId: string,
): Promise<DashboardMetricSummaryRow[]> {
  return sql<DashboardMetricSummaryRow[]>`
    WITH message_rows AS (
      SELECT
        id,
        page_id,
        sender_psid,
        direction,
        COALESCE(timestamp, created_at) AS message_at
      FROM messages
      WHERE page_id = ${pageId}
    ),
    latest_state AS (
      SELECT DISTINCT ON (page_id, psid)
        page_id,
        psid,
        first_response_ms,
        updated_at,
        conversation_id
      FROM conversation_state
      WHERE page_id = ${pageId}
      ORDER BY page_id, psid, updated_at DESC NULLS LAST, conversation_id DESC NULLS LAST
    ),
    response_pairs AS (
      SELECT
        inbound.sender_psid,
        inbound.message_at AS inbound_at,
        next_outbound.outbound_at
      FROM message_rows inbound
      LEFT JOIN LATERAL (
        SELECT outbound.message_at AS outbound_at
        FROM message_rows outbound
        WHERE outbound.page_id = inbound.page_id
          AND outbound.sender_psid = inbound.sender_psid
          AND outbound.direction = 'outbound'
          AND (
            outbound.message_at > inbound.message_at
            OR (outbound.message_at = inbound.message_at AND outbound.id > inbound.id)
          )
        ORDER BY outbound.message_at ASC, outbound.id ASC
        LIMIT 1
      ) next_outbound ON TRUE
      WHERE inbound.direction = 'inbound'
    )
    SELECT
      (
        SELECT COUNT(DISTINCT sender_psid)::int
        FROM message_rows
        WHERE message_at > NOW() - INTERVAL '24 hours'
      ) AS conversations_24h,
      (
        SELECT AVG(first_response_ms)::numeric
        FROM latest_state
        WHERE first_response_ms IS NOT NULL
      ) AS avg_first_response_ms,
      (
        SELECT AVG(EXTRACT(EPOCH FROM (outbound_at - inbound_at)) * 1000)::numeric
        FROM response_pairs
        WHERE outbound_at IS NOT NULL
          AND outbound_at > inbound_at
          AND outbound_at <= inbound_at + INTERVAL '1 hour'
      ) AS avg_message_response_ms
  `;
}

function getDashboardSql() {
  const databaseUrl = getDashboardDatabaseUrl();
  if (!databaseUrl) return null;

  if (
    !globalThis.__rocketeerioDashboardSql ||
    globalThis.__rocketeerioDashboardSqlUrl !== databaseUrl
  ) {
    globalThis.__rocketeerioDashboardSql = postgres(databaseUrl, {
      max: 2,
      prepare: false,
      ssl: shouldUseSsl(databaseUrl) ? "require" : undefined,
      idle_timeout: 20,
    });
    globalThis.__rocketeerioDashboardSqlUrl = databaseUrl;
  }

  return globalThis.__rocketeerioDashboardSql;
}

function getDashboardDatabaseUrl() {
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

function mapMiddlewarePageRow(row: MiddlewarePageRow): DashboardConnectedPage {
  const channel = row.channel ?? "facebook";

  return {
    id: Number(row.id),
    pageId: row.page_id,
    name: row.page_name ?? `Facebook Page ${row.page_id}`,
    category: channel === "facebook" ? "Facebook Page" : channel,
    pictureUrl: null,
    isActive: row.ai_enabled ?? true,
    connectedAt: row.updated_at ?? row.created_at,
  };
}

function mapDashboardConversationKpis(
  rows: DashboardConversationMetricRow[],
  summary: DashboardMetricSummaryRow | null,
): DashboardKpis {
  const conversations24h = toNumber(summary?.conversations_24h ?? null);
  const totalContacts = rows.length;
  const hotLeads = countDashboardHotLeads(rows);
  const qualifiedLeads = countDashboardQualifiedLeads(rows);
  const bookedCalls = countDashboardBookedCalls(rows);
  const responseMs =
    toNullableNumber(summary?.avg_first_response_ms ?? null) ??
    toNullableNumber(summary?.avg_message_response_ms ?? null);

  return {
    conversations24h: {
      value: formatCount(conversations24h),
      sub:
        conversations24h === 1
          ? "1 active Messenger thread"
          : "Distinct Messenger threads",
    },
    totalContacts: {
      value: formatCount(totalContacts),
      sub:
        totalContacts === 1
          ? "1 person has messaged Josh"
          : "Everyone who has messaged Josh",
    },
    hotLeads: {
      value: formatCount(hotLeads),
      sub: "Hot signals from conversations",
    },
    qualifiedLeads: {
      value: formatCount(qualifiedLeads),
      sub: "Qualification score is high",
    },
    avgResponseTime: {
      value: formatDuration(responseMs),
      sub: responseMs === null ? "No replies measured yet" : "Average first reply time",
    },
    bookedCalls: {
      value: formatCount(bookedCalls),
      sub: bookedCalls === 1 ? "1 booking signal detected" : "Booking signals in conversations",
    },
  };
}

function countDashboardHotLeads(rows: DashboardConversationMetricRow[]) {
  return rows.filter(isDashboardHotLead).length;
}

function countDashboardQualifiedLeads(rows: DashboardConversationMetricRow[]) {
  return rows.filter(isDashboardQualifiedLead).length;
}

function countDashboardBookedCalls(rows: DashboardConversationMetricRow[]) {
  return rows.filter((row) => BOOKING_SIGNAL_REGEX.test(searchableDashboardLeadText(row))).length;
}

function isDashboardQualifiedLead(row: DashboardConversationMetricRow) {
  return row.qualification_score === "HIGH";
}

function isDashboardHotLead(row: DashboardConversationMetricRow) {
  if (isDashboardQualifiedLead(row)) return true;
  return HOT_SIGNAL_REGEX.test(searchableDashboardLeadText(row));
}

function searchableDashboardLeadText(row: DashboardConversationMetricRow) {
  return `${row.latest_content ?? ""} ${stringifyDashboardData(row.qualification_data)}`;
}

function stringifyDashboardData(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function buildUnavailableKpis(sub: string): DashboardKpis {
  return {
    conversations24h: { value: "—", sub },
    totalContacts: { value: "—", sub },
    hotLeads: { value: "—", sub },
    qualifiedLeads: { value: "—", sub },
    avgResponseTime: { value: "—", sub },
    bookedCalls: { value: "—", sub: "Booking tracking coming soon" },
  };
}

function toNumber(value: number | string | null) {
  return toNullableNumber(value) ?? 0;
}

function toNullableNumber(value: number | string | null) {
  if (value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;

  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)}m`;

  return `${Math.round(minutes / 60)}h`;
}
