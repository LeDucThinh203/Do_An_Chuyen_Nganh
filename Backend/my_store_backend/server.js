import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import uiRoutes from './routes/ui.js'; // gom tất cả route

dotenv.config();
const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));

// --- Mount tất cả route ---
app.use('/', uiRoutes);

// --- Server config ---
const PORT = process.env.PORT || 3006;
const SERVER_URL = process.env.USE_NGROK === 'true' && process.env.NGROK_URL
  ? process.env.NGROK_URL
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
      description: "API CRUD cho database my_store",
    },
    servers: [{ url: SERVER_URL }],
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

// --- Start server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔗 Swagger UI: ${SERVER_URL}/swagger`);
});
