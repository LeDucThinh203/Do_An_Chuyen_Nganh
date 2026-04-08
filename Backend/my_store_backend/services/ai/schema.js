import db from '../../db.js';

export const ensureAiSchema = async () => {
  // ai_conversations: chat history per session/user
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      session_id VARCHAR(64) NOT NULL,
      user_id BIGINT NULL,
      role VARCHAR(32) NOT NULL,
      content LONGTEXT NULL,
      tool_name VARCHAR(128) NULL,
      tool_payload LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session_id (session_id),
      INDEX idx_user_role (user_id, role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ai_memory: long term user memory summaries with vector stored as JSON string
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_memory (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      summary TEXT NULL,
      embedding LONGTEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      UNIQUE KEY uk_ai_mem_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // product_embeddings: cache semantic vectors for products
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_embeddings (
      product_id BIGINT PRIMARY KEY,
      embedding LONGTEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};
