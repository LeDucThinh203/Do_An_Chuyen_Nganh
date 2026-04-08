import db from '../../db.js';

export const ensureAiSchema = async () => {
  // ai_conversations: chat history per session/user
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id BIGSERIAL PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      user_id BIGINT NULL,
      role VARCHAR(32) NOT NULL,
      content TEXT NULL,
      tool_name VARCHAR(128) NULL,
      tool_payload TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_ai_conv_session_id ON ai_conversations (session_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_ai_conv_user_role ON ai_conversations (user_id, role)');

  // ai_memory: long term user memory summaries with vector stored as JSON string
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_memory (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      summary TEXT NULL,
      embedding TEXT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id)
    );
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_ai_mem_user ON ai_memory (user_id)');

  // product_embeddings: cache semantic vectors for products
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_embeddings (
      product_id BIGINT PRIMARY KEY,
      embedding TEXT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
