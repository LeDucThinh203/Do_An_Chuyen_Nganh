# 🚀 Quick Start — Deploy to Render with Neon PostgreSQL

## 1. Create the Neon database

1. Create a PostgreSQL project in Neon.
2. In **Connect**, choose **Pooled connection** and copy the connection string. Its hostname must contain `-pooler`; keep the TLS query parameter such as `sslmode=require`.
3. Run `Database/POSTGRES_RENDER_INIT.sql` in Neon SQL Editor to create the base schema.

## 2. Deploy the backend

1. Push the project to GitHub.
2. In Render, create a Blueprint from the repository or create the backend service using the repository's `render.yaml`.
3. Set `DATABASE_URL` to the Neon pooled connection string. Set `GEMINI_API_KEY`; Render generates `JWT_SECRET` from the Blueprint.
4. Keep the pool defaults in `render.yaml` initially: `DB_POOL_MAX=10`, `DB_IDLE_TIMEOUT_MS=30000`, and `DB_CONN_TIMEOUT_MS=15000`.

## 3. Deploy the frontend

Deploy `frontend` as a Render Static Site and set `REACT_APP_API_URL` to the deployed backend URL. The root `render.yaml` already contains a frontend service.

## 4. Check the deployment

- Open `https://<backend-host>/health` to check the API process.
- Inspect the Render logs for PostgreSQL connection errors.
- AI and support-chat tables are initialized by the backend on startup.

Do not commit `DATABASE_URL`, database passwords, or API keys. For local setup, pool behavior, schema migration, and troubleshooting, see [NEON_POSTGRES_GUIDE.md](Backend/my_store_backend/NEON_POSTGRES_GUIDE.md).
