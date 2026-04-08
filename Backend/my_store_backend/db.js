import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const toPgPlaceholders = (sql) => {
  let idx = 0;
  let inSingle = false;
  let inDouble = false;
  let out = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';

    if (ch === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      out += ch;
      continue;
    }

    if (ch === '?' && !inSingle && !inDouble) {
      idx += 1;
      out += `$${idx}`;
    } else {
      out += ch;
    }
  }
  return out;
};

const normalizeSql = (sql, params) => {
  let nextSql = sql;
  let nextParams = Array.isArray(params) ? [...params] : [];

  // Support MySQL-style bulk insert: VALUES ? with [[...], [...]]
  if (/VALUES\s*\?/i.test(nextSql) && Array.isArray(nextParams[0]) && Array.isArray(nextParams[0][0])) {
    const rows = nextParams[0];
    const flattened = [];
    const valueChunks = rows.map((row) => {
      const placeholders = row.map((v) => {
        flattened.push(v);
        return '?';
      });
      return `(${placeholders.join(', ')})`;
    });

    nextSql = nextSql.replace(/VALUES\s*\?/i, `VALUES ${valueChunks.join(', ')}`);
    nextParams = flattened;
  }

  // MySQL booleans often come in as 0/1; PostgreSQL boolean columns accept true/false safely.
  nextParams = nextParams.map((v) => (v === 0 || v === 1 ? v : v));
  return { sql: nextSql, params: nextParams };
};

const mapResult = (result) => {
  const rows = result?.rows || [];
  const first = rows[0] || {};
  const meta = {
    insertId: first.id ?? null,
    affectedRows: result?.rowCount || 0,
    rowCount: result?.rowCount || 0,
  };
  return [rows, meta];
};

const buildPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS || 15000),
    };
  }

  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 5432),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS || 15000),
  };
};

const pool = new Pool(buildPoolConfig());

const runQuery = async (client, sql, params = []) => {
  const normalized = normalizeSql(sql, params);
  const pgSql = toPgPlaceholders(normalized.sql);
  const isInsert = /^\s*insert\s+/i.test(pgSql);
  const hasReturning = /\breturning\b/i.test(pgSql);

  const finalSql = isInsert && !hasReturning ? `${pgSql} RETURNING *` : pgSql;
  const result = await client.query(finalSql, normalized.params);

  // Keep mysql2-like shape for existing repositories: [rowsOrMeta, meta]
  if (/^\s*select\s+/i.test(pgSql)) {
    return [result.rows, null];
  }

  const [rows, meta] = mapResult(result);
  return [meta, rows];
};

const db = {
  query: async (sql, params = []) => runQuery(pool, sql, params),

  getConnection: async () => {
    const client = await pool.connect();
    return {
      query: async (sql, params = []) => runQuery(client, sql, params),
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  },
};

export default db;
