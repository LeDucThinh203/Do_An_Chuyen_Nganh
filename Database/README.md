# Database scripts guide

This folder contains SQL scripts to set up, clean, and optimize the database for the store and AI assistant (RAG + memory + tools).

## Files overview

- DBWebBanDoBongDa.sql
  - Full database dump for schema + seed data (my_store).
  - Creates database, tables, FKs, and inserts initial data.
  - Includes a normalization step to prefix product.image with /images/ safely after import.

- AI_Schema.sql
  - Adds AI-specific tables: ai_conversations, ai_memory, product_embeddings, etc.
  - Use after importing the main dump.

- AI_Data_Cleanup_And_Constraints.sql
  - Cleans orphan rows in product_embeddings (safe update mode compatible).
  - Adds data integrity constraints (FK with ON DELETE CASCADE, UNIQUEs, CHECKs).
  - Adds a couple of helpful indexes for analytics/cleanup.
  - Fully idempotent: safe to run multiple times.

- AI_Performance_Indexes.sql
  - Adds performance indexes for product search, AI chat history, orders, etc.
  - Fully idempotent: safe to run multiple times.

## Recommended run order

1) DBWebBanDoBongDa.sql
2) AI_Schema.sql
3) AI_Data_Cleanup_And_Constraints.sql
4) AI_Performance_Indexes.sql

Notes
- Run (3) before (4) if you want constraints in place before building indexes.
- All scripts use `USE my_store;` internally.

## How to run

### MySQL Workbench (GUI)
- Open each .sql file in order and click Execute.
- Keep the same connection; scripts manage session settings as needed.

### MySQL CLI on Windows PowerShell
Replace <user> and paths as appropriate.

```powershell
# 1) Import main dump (creates DB)
mysql -u <user> -p -h 127.0.0.1 < "D:\\DACN\\DAcn\\Do_An_Chuyen_Nganh\\Database\\DBWebBanDoBongDa.sql"

# 2) AI schema
mysql -u <user> -p -h 127.0.0.1 my_store < "D:\\DACN\\DAcn\\Do_An_Chuyen_Nganh\\Database\\AI_Schema.sql"

# 3) Cleanup + constraints
mysql -u <user> -p -h 127.0.0.1 my_store < "D:\\DACN\\DAcn\\Do_An_Chuyen_Nganh\\Database\\AI_Data_Cleanup_And_Constraints.sql"

# 4) Performance indexes
mysql -u <user> -p -h 127.0.0.1 my_store < "D:\\DACN\\DAcn\\Do_An_Chuyen_Nganh\\Database\\AI_Performance_Indexes.sql"
```

## What each script does (details)

### 1) DBWebBanDoBongDa.sql
- Drops and creates database `my_store`.
- Creates core tables (account, product, sizes, product_sizes, orders, order_details, rating, category, ...).
- Inserts sample data.
- Normalizes product images to standard paths:
  - Converts `\\` to `/`.
  - Ensures values start with `/images/` when not an http(s) URL.

### 2) AI_Schema.sql
- Creates AI tables for chat history and long-term memory.
- Sets appropriate charsets/collations.

### 3) AI_Data_Cleanup_And_Constraints.sql
- Deletes orphan rows from `product_embeddings` using a single-table DELETE + NOT EXISTS (supports LIMIT and safe updates within the session).
- Adds FK: `product_embeddings.product_id → product(id) ON DELETE CASCADE` to auto-clean embeddings when products are removed.
- Adds UNIQUE constraints to prevent duplicates:
  - `product_sizes(product_id, size_id)`
  - `rating(order_detail_id)`
  - `sizes(size)`
- Adds CHECK constraints (MySQL 8.0+):
  - `order_details.quantity > 0`
  - `order_details.price >= 0`
- Adds helpful indexes:
  - `ai_conversations(created_at)`
  - `orders(account_id, created_at)`
- Idempotent via information_schema checks.

### 4) AI_Performance_Indexes.sql
- Product: name (prefix), price, category_id, category_id+price.
- Product sizes: product_id, size_id.
- AI conversations: session_id+id, user_id+created_at.
- Product embeddings: updated_at.
- Orders: account_id+id DESC, status.
- Order details: order_id, product_sizes_id.
- Category: name(50).
- Sizes: size(10).
- Idempotent via information_schema checks.

## Verification queries (optional)
Run these to sanity-check results after scripts:

```sql
-- Orphan embeddings should be 0
SELECT COUNT(*) AS orphan_embeddings
FROM product_embeddings pe
WHERE NOT EXISTS (
  SELECT 1 FROM product p WHERE p.id = pe.product_id
);

-- All product images should be normalized or absolute URLs
SELECT id, image
FROM product
WHERE image IS NOT NULL
  AND image NOT LIKE '/images/%'
  AND image NOT LIKE 'http%'
LIMIT 20;

-- Duplicate sizes per product should be 0 rows
SELECT product_id, size_id, COUNT(*) c
FROM product_sizes
GROUP BY product_id, size_id
HAVING c > 1
LIMIT 10;

-- Duplicate ratings for the same order_detail should be 0 rows
SELECT order_detail_id, COUNT(*) c
FROM rating
GROUP BY order_detail_id
HAVING c > 1
LIMIT 10;
```

## Troubleshooting

- Error Code: 1175 (safe update mode)
  - The cleanup script temporarily adjusts `SQL_SAFE_UPDATES` in-session, then restores it.
  - If running manual DELETE statements, prefer the provided script or disable/restore safe mode for the session.

- Error Code: 1061 (Duplicate key name)
  - All index scripts are idempotent; re-run should not fail. If you created an index manually with a different name, the script will still skip known names; adjust if needed.

- Error Code: 1064 near LIMIT in DELETE ... JOIN
  - MySQL disallows LIMIT in multi-table DELETE. The cleanup script uses a single-table DELETE with NOT EXISTS to support LIMIT.

## Notes
- All scripts target MySQL 8.0+.
- Collations/charsets are set per table to support Vietnamese. If you need a single collation across the entire DB, plan a maintenance window and convert at the database level.
- You can re-run the performance indexes periodically after new features or query changes.

---
Maintained by: Database + AI team. Last updated: 2025-11-12.