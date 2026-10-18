# Database files and setup

The current backend uses PostgreSQL through `pg.Pool`. For Neon setup and pooled connections, follow [NEON_POSTGRES_GUIDE.md](../Backend/my_store_backend/NEON_POSTGRES_GUIDE.md).

## PostgreSQL schema

- `POSTGRES_RENDER_INIT.sql` creates the base application tables. Run it once in Neon SQL Editor or let Docker Compose run it when initializing a new local PostgreSQL volume.
- For an existing database, run `POSTGRES_QUERY_PERFORMANCE_INDEXES.sql` once to add the indexes used by cursor pagination, relation lookups, password reset, and substring product search. The script enables `pg_trgm` for product search indexes.
- AI and support-chat tables are created by the backend at startup.
- To copy existing records from a legacy MySQL dump into PostgreSQL, use `npm run db:import:mysql` from `Backend/my_store_backend` with `DATABASE_URL` set.

## Legacy MySQL files

The other `DBWebBanDoBongDa*.sql`, `AI_*.sql`, and `UPDATE_*.sql` files are historical MySQL schemas and migration inputs. Do not execute them directly against Neon PostgreSQL. Use the PostgreSQL bootstrap script above for a fresh database.
