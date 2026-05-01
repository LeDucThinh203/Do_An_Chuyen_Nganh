import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import uiRoutes from './routes/ui.js'; // gom tất cả route
import { ensureAiSchema } from './services/ai/schema.js';
import { ensureSupportChatSchema } from './services/supportChat/schema.js';
import { initSupportSocket } from './services/supportChat/socketHub.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// --- Middleware ---
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token vào đây (không cần thêm "Bearer ")'
        }
      }
    },
    security: [{
      bearerAuth: []
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
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Internal test endpoint: SendGrid + SMTP connectivity ---
// Protect with INTERNAL_TEST_TOKEN env var: /internal/test-mail?token=XXX
app.get('/internal/test-mail', async (req, res) => {
  const token = String(req.query.token || '').trim();
  const expected = String(process.env.INTERNAL_TEST_TOKEN || '').trim();
  if (!expected) return res.status(403).json({ error: 'INTERNAL_TEST_TOKEN not configured' });
  if (!token || token !== expected) return res.status(401).json({ error: 'invalid token' });

  const result = { sendgrid: null, smtp: null };
  const to = String(process.env.EMAIL_TEST_TO || process.env.EMAIL_USER || '').trim();

  // Test SendGrid API
  try {
    const apiKey = String(process.env.SENDGRID_API_KEY || '').trim();
    const from = String(process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || '').trim();
    if (!apiKey || !from) {
      result.sendgrid = { ok: false, error: 'SendGrid not configured (SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing)' };
    } else {
      const payload = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: 'Connectivity test (SendGrid API)',
        content: [{ type: 'text/plain', value: 'SendGrid connectivity test' }]
      };
      const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await r.text();
      result.sendgrid = { ok: r.ok, status: r.status, body: text.slice(0, 200) };
    }
  } catch (e) {
    result.sendgrid = { ok: false, error: e?.message || String(e) };
  }

  // Test SMTP verify (no email send)
  try {
    const nodemailer = await import('nodemailer');
    const host = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const user = String(process.env.EMAIL_USER || '').trim();
    const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

    if (!user || !pass) {
      result.smtp = { ok: false, error: 'SMTP credentials not configured (EMAIL_USER / EMAIL_PASS)' };
    } else {
      const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 });
      try {
        await transporter.verify();
        result.smtp = { ok: true, message: 'SMTP reachable and auth OK' };
      } catch (err) {
        result.smtp = { ok: false, error: err?.code || err?.message || String(err) };
      }
    }
  } catch (e) {
    result.smtp = { ok: false, error: e?.message || String(e) };
  }

  res.json(result);
});

// --- Start server ---
initSupportSocket(httpServer);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Swagger UI: ${SERVER_URL}/swagger`);

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





