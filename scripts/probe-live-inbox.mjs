import fs from 'fs';
import postgres from 'postgres';

const ENV_PATH = fs.existsSync('/home/ubuntu/rocketeerio/.env.production.decrypted')
  ? '/home/ubuntu/rocketeerio/.env.production.decrypted'
  : '/home/ubuntu/rocketeerio/.env.production.probe';

function parseEnvFile(path) {
  const result = {};
  if (!fs.existsSync(path)) return result;
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx);
    let value = line.slice(idx + 1);
    try {
      value = JSON.parse(value);
    } catch {
      value = value.replace(/^['"]|['"]$/g, '');
    }
    result[key] = value;
  }
  return result;
}

function mask(value) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return `${text.slice(0, 2)}…${text.slice(-2)}`;
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function shouldUseSsl(url) {
  return !/localhost|127\.0\.0\.1|::1/.test(url);
}

async function tableExists(sql, tableName) {
  const rows = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function columnExists(sql, tableName, columnName) {
  const rows = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function countTable(sql, tableName) {
  if (!(await tableExists(sql, tableName))) return null;
  const rows = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return Number(rows[0]?.count ?? 0);
}

async function latestRows(sql, tableName, columns, orderColumn, limit = 5) {
  if (!(await tableExists(sql, tableName))) return [];
  if (orderColumn && !(await columnExists(sql, tableName, orderColumn))) orderColumn = null;
  const select = columns.join(', ');
  const order = orderColumn ? `ORDER BY ${orderColumn} DESC NULLS LAST` : '';
  return sql.unsafe(`SELECT ${select} FROM ${tableName} ${order} LIMIT ${limit}`);
}

async function probeDatabase(label, url) {
  if (!url) return { label, configured: false };
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: shouldUseSsl(url) ? 'require' : undefined,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  try {
    const current = await sql`SELECT current_database() AS database, current_schema() AS schema, NOW() AS now`;
    const tableRows = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = tableRows.map((row) => row.table_name);

    const counts = {};
    for (const table of ['users', 'facebook_pages', 'pages', 'messages', 'conversation_state', 'sessions']) {
      counts[table] = await countTable(sql, table);
    }

    const frontendPages = await latestRows(
      sql,
      'facebook_pages',
      ['id', 'user_id', 'page_id', 'name', 'is_active', 'connected_at', 'updated_at'],
      'updated_at',
      10,
    );

    const middlewarePages = await latestRows(
      sql,
      'pages',
      ['id', 'page_id', 'page_name', 'channel', 'ai_enabled', 'created_at', 'updated_at'],
      'updated_at',
      10,
    );

    let messageRollups = [];
    if (await tableExists(sql, 'messages')) {
      const hasPageId = await columnExists(sql, 'messages', 'page_id');
      const hasSenderPsid = await columnExists(sql, 'messages', 'sender_psid');
      const hasDirection = await columnExists(sql, 'messages', 'direction');
      if (hasPageId && hasSenderPsid && hasDirection) {
        messageRollups = await sql`
          SELECT
            page_id,
            COUNT(*)::int AS messages,
            COUNT(DISTINCT sender_psid)::int AS contacts,
            COUNT(*) FILTER (WHERE direction = 'inbound')::int AS inbound,
            COUNT(*) FILTER (WHERE direction = 'outbound')::int AS outbound,
            MAX(COALESCE(timestamp, created_at)) AS latest_at
          FROM messages
          GROUP BY page_id
          ORDER BY latest_at DESC NULLS LAST
          LIMIT 20
        `;
      }
    }

    let conversationStateRollups = [];
    if (await tableExists(sql, 'conversation_state')) {
      const hasPageId = await columnExists(sql, 'conversation_state', 'page_id');
      const hasPsid = await columnExists(sql, 'conversation_state', 'psid');
      if (hasPageId && hasPsid) {
        conversationStateRollups = await sql`
          SELECT
            page_id,
            COUNT(*)::int AS state_rows,
            COUNT(DISTINCT psid)::int AS contacts,
            MAX(updated_at) AS latest_at
          FROM conversation_state
          GROUP BY page_id
          ORDER BY latest_at DESC NULLS LAST
          LIMIT 20
        `;
      }
    }

    return {
      label,
      configured: true,
      connected: true,
      database: current[0]?.database,
      table_count: tables.length,
      tables,
      counts,
      frontend_pages: frontendPages.map((row) => ({ ...row, page_id_masked: mask(row.page_id), user_id_masked: mask(row.user_id), page_id: undefined, user_id: undefined })),
      middleware_pages: middlewarePages.map((row) => ({ ...row, page_id_masked: mask(row.page_id), page_id: undefined })),
      message_rollups: messageRollups.map((row) => ({ ...row, page_id_masked: mask(row.page_id), page_id: undefined })),
      conversation_state_rollups: conversationStateRollups.map((row) => ({ ...row, page_id_masked: mask(row.page_id), page_id: undefined })),
    };
  } catch (error) {
    return { label, configured: true, connected: false, error: error.message };
  } finally {
    await sql.end({ timeout: 3 }).catch(() => undefined);
  }
}

const env = parseEnvFile(ENV_PATH);
const targets = [
  ['DATABASE_URL', env.DATABASE_URL],
  ['ROCKETEERIO_MIDDLEWARE_DATABASE_URL', env.ROCKETEERIO_MIDDLEWARE_DATABASE_URL],
  ['LIVE_INBOX_DATABASE_URL', env.LIVE_INBOX_DATABASE_URL],
].filter(([key, value], index, list) => value && list.findIndex(([, candidate]) => candidate === value) === index);

const results = [];
for (const [label, url] of targets) {
  results.push(await probeDatabase(label, url));
}

console.log(JSON.stringify(results, null, 2));
