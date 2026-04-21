import db from '../../db.js';

export const ensureSupportChatSchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_chat_rooms (
      room_id VARCHAR(128) PRIMARY KEY,
      user_id BIGINT NULL,
      guest_id VARCHAR(128) NULL,
      username VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'open',
      last_message TEXT NULL,
      last_sender_role VARCHAR(32) NULL,
      last_message_at TIMESTAMPTZ NULL,
      admin_unread_count INT NOT NULL DEFAULT 0,
      user_unread_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query('CREATE INDEX IF NOT EXISTS idx_support_rooms_user_id ON support_chat_rooms (user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_support_rooms_guest_id ON support_chat_rooms (guest_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_support_rooms_last_message_at ON support_chat_rooms (last_message_at DESC)');

  await db.query(`
    CREATE TABLE IF NOT EXISTS support_chat_messages (
      id BIGSERIAL PRIMARY KEY,
      room_id VARCHAR(128) NOT NULL,
      sender_role VARCHAR(32) NOT NULL,
      sender_id BIGINT NULL,
      sender_name VARCHAR(255) NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query('CREATE INDEX IF NOT EXISTS idx_support_messages_room_created ON support_chat_messages (room_id, created_at DESC)');
};
