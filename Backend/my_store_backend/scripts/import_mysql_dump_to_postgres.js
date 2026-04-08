import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const includeAi = args.includes("--include-ai");
const dumpArg = args.find((arg) => arg.startsWith("--dump="));
const dumpPath = dumpArg
  ? path.resolve(process.cwd(), dumpArg.replace("--dump=", ""))
  : path.join(repoRoot, "Database", "DBWebBanDoBongDa.sql");

const databaseUrl = (process.env.DATABASE_URL || "").trim();

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in environment (value is empty).");
  console.error("Set DATABASE_URL in .env, for example:");
  console.error("DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require");
  console.error("Or in PowerShell for current session:");
  console.error('$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"');
  process.exit(1);
}

if (!fs.existsSync(dumpPath)) {
  console.error(`Dump file not found: ${dumpPath}`);
  process.exit(1);
}

const TABLE_CONFIG = {
  account: {
    columns: [
      "id",
      "email",
      "username",
      "password",
      "role",
      "created_at",
      "updated_at",
      "reset_token",
      "reset_token_expiry"
    ],
    conflictColumns: ["id"]
  },
  category: {
    columns: ["id", "name", "description"],
    conflictColumns: ["id"]
  },
  product: {
    columns: ["id", "name", "description", "price", "discount_percent", "image", "category_id"],
    conflictColumns: ["id"]
  },
  sizes: {
    columns: ["id", "size"],
    conflictColumns: ["id"]
  },
  product_sizes: {
    columns: ["id", "product_id", "size_id", "stock"],
    conflictColumns: ["id"]
  },
  address: {
    columns: [
      "id",
      "account_id",
      "name",
      "phone",
      "provincename",
      "districtname",
      "wardname",
      "address_detail"
    ],
    conflictColumns: ["id"]
  },
  orders: {
    columns: [
      "id",
      "name",
      "phone",
      "address",
      "status",
      "created_at",
      "account_id",
      "total_amount",
      "payment_method",
      "is_paid",
      "payment_info"
    ],
    conflictColumns: ["id"],
    transform: (row) => {
      const transformed = [...row];
      transformed[9] = toBoolean(row[9]);
      return transformed;
    }
  },
  order_details: {
    columns: ["id", "order_id", "product_sizes_id", "quantity", "price"],
    conflictColumns: ["id"]
  },
  rating: {
    columns: ["id", "rating_value", "comment", "order_detail_id"],
    conflictColumns: ["id"],
    transform: (row) => [row[0], row[1], row[2], row[4]]
  },
  ai_conversations: {
    columns: [
      "id",
      "session_id",
      "user_id",
      "role",
      "content",
      "tool_name",
      "tool_payload",
      "created_at"
    ],
    conflictColumns: ["id"]
  },
  ai_memory: {
    columns: ["id", "user_id", "summary", "embedding", "updated_at"],
    conflictColumns: ["id"]
  },
  product_embeddings: {
    columns: ["product_id", "embedding", "updated_at"],
    conflictColumns: ["product_id"]
  }
};

const BUSINESS_IMPORT_ORDER = [
  "account",
  "category",
  "product",
  "sizes",
  "product_sizes",
  "address",
  "orders",
  "order_details",
  "rating"
];

const AI_IMPORT_ORDER = ["ai_conversations", "ai_memory", "product_embeddings"];

function toBoolean(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "t";
  }
  return false;
}

function quoteIdent(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function unescapeMySqlString(value) {
  return value
    .replace(/\\0/g, "\0")
    .replace(/\\b/g, "\b")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\Z/g, "\x1A")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function parseToken(token) {
  const trimmed = token.trim();

  if (/^null$/i.test(trimmed)) return null;

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return unescapeMySqlString(trimmed.slice(1, -1));
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function splitTupleFields(tupleBody) {
  const fields = [];
  let current = "";
  let inString = false;
  let escaping = false;

  for (let i = 0; i < tupleBody.length; i += 1) {
    const ch = tupleBody[i];

    if (inString) {
      current += ch;

      if (escaping) {
        escaping = false;
      } else if (ch === "\\") {
        escaping = true;
      } else if (ch === "'") {
        inString = false;
      }

      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === ",") {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  fields.push(current.trim());
  return fields;
}

function extractTuples(valuesChunk) {
  const tuples = [];
  let inString = false;
  let escaping = false;
  let depth = 0;
  let current = "";

  for (let i = 0; i < valuesChunk.length; i += 1) {
    const ch = valuesChunk[i];

    if (inString) {
      current += ch;

      if (escaping) {
        escaping = false;
      } else if (ch === "\\") {
        escaping = true;
      } else if (ch === "'") {
        inString = false;
      }

      continue;
    }

    if (ch === "'") {
      inString = true;
      if (depth > 0) current += ch;
      continue;
    }

    if (ch === "(") {
      if (depth === 0) {
        current = "";
      } else {
        current += ch;
      }
      depth += 1;
      continue;
    }

    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current);
        current = "";
      } else {
        current += ch;
      }
      continue;
    }

    if (depth > 0) {
      current += ch;
    }
  }

  return tuples;
}

function extractInsertValuesByTable(sqlText) {
  const map = new Map();
  const marker = "INSERT INTO `";
  let searchFrom = 0;

  while (searchFrom < sqlText.length) {
    const start = sqlText.indexOf(marker, searchFrom);
    if (start === -1) break;

    const tableStart = start + marker.length;
    const tableEnd = sqlText.indexOf("`", tableStart);
    if (tableEnd === -1) break;

    const table = sqlText.slice(tableStart, tableEnd);
    const valuesKeyword = " VALUES";
    const valuesPos = sqlText.indexOf(valuesKeyword, tableEnd);
    if (valuesPos === -1) break;

    const chunkStart = valuesPos + valuesKeyword.length;

    let i = chunkStart;
    let inString = false;
    let escaping = false;
    while (i < sqlText.length) {
      const ch = sqlText[i];

      if (inString) {
        if (escaping) {
          escaping = false;
        } else if (ch === "\\") {
          escaping = true;
        } else if (ch === "'") {
          inString = false;
        }
      } else if (ch === "'") {
        inString = true;
      } else if (ch === ";") {
        break;
      }

      i += 1;
    }

    if (i >= sqlText.length) break;

    const valuesChunk = sqlText.slice(chunkStart, i).trim();

    if (!map.has(table)) {
      map.set(table, []);
    }
    map.get(table).push(valuesChunk);

    searchFrom = i + 1;
  }

  return map;
}

function buildInsertSql(table, columns, conflictColumns) {
  const quotedTable = quoteIdent(table);
  const quotedColumns = columns.map(quoteIdent).join(", ");
  const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(", ");

  const updatableColumns = columns.filter((col) => !conflictColumns.includes(col));

  const updateClause = updatableColumns.length
    ? updatableColumns.map((col) => `${quoteIdent(col)} = EXCLUDED.${quoteIdent(col)}`).join(", ")
    : `${quoteIdent(conflictColumns[0])} = EXCLUDED.${quoteIdent(conflictColumns[0])}`;

  return `
    INSERT INTO ${quotedTable} (${quotedColumns})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumns.map(quoteIdent).join(", ")})
    DO UPDATE SET ${updateClause}
  `;
}

async function tableExists(client, table) {
  const result = await client.query("SELECT to_regclass($1) AS reg", [table]);
  return Boolean(result.rows[0]?.reg);
}

async function clearTables(client, tableOrder) {
  for (let i = tableOrder.length - 1; i >= 0; i -= 1) {
    const table = tableOrder[i];
    if (await tableExists(client, table)) {
      await client.query(`DELETE FROM ${quoteIdent(table)}`);
    }
  }
}

async function resetSequence(client, table) {
  const sequenceQuery = `
    SELECT pg_get_serial_sequence($1, 'id') AS seq
  `;
  const sequenceResult = await client.query(sequenceQuery, [quoteIdent(table)]);
  const sequenceName = sequenceResult.rows[0]?.seq;

  if (!sequenceName) return;

  await client.query(
    `
      SELECT setval(
        $1,
        COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1),
        COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 0) > 0
      )
    `,
    [sequenceName]
  );
}

async function importTable(client, table, valuesChunks) {
  const config = TABLE_CONFIG[table];
  if (!config) return 0;

  if (!(await tableExists(client, table))) {
    console.log(`Skipping ${table}: table does not exist in PostgreSQL.`);
    return 0;
  }

  const insertSql = buildInsertSql(table, config.columns, config.conflictColumns);
  let insertedCount = 0;

  for (const chunk of valuesChunks) {
    const tuples = extractTuples(chunk);

    for (const tupleBody of tuples) {
      const fields = splitTupleFields(tupleBody).map(parseToken);
      const row = config.transform ? config.transform(fields) : fields;

      if (row.length !== config.columns.length) {
        throw new Error(
          `Column mismatch in ${table}. Expected ${config.columns.length}, got ${row.length}.`
        );
      }

      await client.query(insertSql, row);
      insertedCount += 1;
    }
  }

  if (config.columns.includes("id")) {
    await resetSequence(client, table);
  }

  return insertedCount;
}

async function main() {
  console.log(`Reading dump: ${dumpPath}`);
  const sqlText = fs.readFileSync(dumpPath, "utf8");
  const insertsByTable = extractInsertValuesByTable(sqlText);

  const importOrder = includeAi
    ? [...BUSINESS_IMPORT_ORDER, ...AI_IMPORT_ORDER]
    : BUSINESS_IMPORT_ORDER;

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await clearTables(client, importOrder);

    for (const table of importOrder) {
      const chunks = insertsByTable.get(table) || [];
      if (chunks.length === 0) {
        console.log(`No INSERT data found for ${table}.`);
        continue;
      }

      const count = await importTable(client, table, chunks);
      console.log(`Imported ${count} rows into ${table}.`);
    }

    await client.query("COMMIT");
    console.log("Import completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Import failed. Transaction rolled back.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
