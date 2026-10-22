import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import db from './db.js';

import uiRoutes from './routes/ui.js'; // gom tất cả route
import { ensureAiSchema } from './services/ai/schema.js';
import { ensureSupportChatSchema } from './services/supportChat/schema.js';
import { ensureDemoAccounts } from './services/demoAccounts.js';
import { initSupportSocket } from './services/supportChat/socketHub.js';
import { closeCache, connectCache, getCacheStatus } from './services/cache.js';
import { allowedOrigins, csrfProtection } from './middleware/csrf.js';

const app = express();
const httpServer = createServer(app);

// --- Middleware ---
app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));
app.use(csrfProtection);

// --- Mount tất cả route ---
app.use('/', uiRoutes);

// --- Server config ---
const PORT = process.env.PORT || 3006;
const renderExternal = (process.env.RENDER_EXTERNAL_URL || '').trim();
const normalizedRenderExternal = renderExternal
  // Fix common typo: "https//domain" or "http//domain"
  .replace(/^https?\/\//i, (m) => `${m.slice(0, -2)}://`)
  // Remove accidental duplicated protocol, e.g. "https://https://domain"
  .replace(/^(https?:\/\/)(https?:\/\/)+/i, '$1')
  .replace(/\/+$/, '');
const SERVER_URL = process.env.USE_NGROK === 'true' && process.env.NGROK_URL
  ? process.env.NGROK_URL
  : normalizedRenderExternal
  ? (normalizedRenderExternal.startsWith('http://') || normalizedRenderExternal.startsWith('https://')
      ? normalizedRenderExternal
      : `https://${normalizedRenderExternal}`)
  : `http://localhost:${PORT}`;

// --- Swagger setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Store API",
      version: "1.0.0",
      description: "API CRUD cho database my_store với JWT Authentication",
    },
    servers: [{ url: SERVER_URL }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'coolshop_session',
          description: 'JWT được lưu trong cookie HttpOnly sau khi đăng nhập'
        }
      }
    },
    security: [{
      cookieAuth: []
    }]
  },
  apis: [join(__dirname, 'routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Root route ---
app.get('/', (req, res) => {
  res.send(`
    <h2>My Store API is running</h2>
    <p>Swagger UI available at <a href="/swagger">${SERVER_URL}/swagger</a></p>
  `);
});

// --- Health check endpoint for Render ---
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cache: getCacheStatus()
  });
});


// --- Start server ---
initSupportSocket(httpServer);

let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received; closing HTTP server and PostgreSQL pool.`);

  const forceExitTimer = setTimeout(() => {
    console.error('[server] Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  httpServer.close(async (error) => {
    clearTimeout(forceExitTimer);
    if (error) console.error('[server] HTTP shutdown error:', error);
    try {
      await Promise.all([db.end(), closeCache()]);
    } catch (poolError) {
      console.error('[server] Database/cache shutdown error:', poolError);
    }
    process.exitCode = error ? 1 : 0;
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const startServer = () => {
  // Cache is optional; PostgreSQL remains available while Redis connects or recovers.
  void connectCache();
  httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Swagger UI: ${SERVER_URL}/swagger`);

  // Don't delay the HTTP listener for optional demo-account checks or bcrypt.
  ensureDemoAccounts().catch((error) => {
    console.error('[demo] Could not initialize demo accounts:', error.message);
  });

  // Initialize AI schema AND embeddings in background (don't block startup)
  (async () => {
    try {
      // Ensure AI related tables exist
      await ensureAiSchema().catch((e) => console.error('AI schema init error:', e));
      await ensureSupportChatSchema().catch((e) => console.error('Support chat schema init error:', e));
      
      // Auto-generate embeddings for products without cache (background task)
      // Limit to small batch to avoid blocking server startup
      const { ensureEmbeddingsForProducts } = await import('./services/ai/vectorStore.js');
      const defaultStartupBatch = process.env.NODE_ENV === 'production' ? '0' : '20';
      const STARTUP_BATCH_SIZE = parseInt(process.env.EMBEDDING_STARTUP_BATCH || defaultStartupBatch);

      if (STARTUP_BATCH_SIZE <= 0) {
        console.log('ℹ️  Skip startup embedding generation (EMBEDDING_STARTUP_BATCH <= 0)');
        return;
      }
      
      const count = await ensureEmbeddingsForProducts(STARTUP_BATCH_SIZE);
      if (count > 0) {
        console.log(`✅ Generated ${count} product embeddings on startup`);
        console.log(`💡 For large product catalogs, run: node scripts/generate_embeddings.js`);
      } else {
        console.log(`✅ All product embeddings already cached`);
      }
    } catch (e) {
      console.warn('⚠️  Background initialization warning:', e.message);
    }
  })();
  });
};

startServer();





