import db from '../../db.js';
import { embedText, cosineSim } from './embeddings.js';

export const saveMessage = async ({ session_id, user_id, role, content, tool_name = null, tool_payload = null }) => {
  await db.query(
    `INSERT INTO ai_conversations (session_id, user_id, role, content, tool_name, tool_payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [session_id, user_id || null, role, content || null, tool_name, tool_payload ? JSON.stringify(tool_payload) : null]
  );
};

export const deleteOrderTracking = async (session_id) => {
  await db.query(
    `DELETE FROM ai_conversations WHERE session_id=? AND tool_name='order_tracking'`,
    [session_id]
  );
};

export const getOrderTracking = async (session_id) => {
  const [rows] = await db.query(
    `SELECT content FROM ai_conversations WHERE session_id=? AND tool_name='order_tracking' ORDER BY id DESC LIMIT 1`,
    [session_id]
  );
  return rows.length > 0 ? rows[0].content : null;
};

export const getRecentMessages = async (session_id, limit = 12) => {
  const [rows] = await db.query(
    `SELECT role, content FROM ai_conversations WHERE session_id=? ORDER BY id DESC LIMIT ?`,
    [session_id, limit]
  );
  return rows.reverse();
};

export const upsertLongTermMemory = async (user_id, summary) => {
  if (!user_id || !summary) return;
  let vec = [];
  try {
    vec = await embedText(summary);
  } catch (e) {
    console.warn('[AI] Skip upsertLongTermMemory embedding:', e.message);
    return;
  }
  const sql = `
    INSERT INTO ai_memory (user_id, summary, embedding, updated_at)
    VALUES (?, ?, ?, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      summary = EXCLUDED.summary,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
  `;
  await db.query(sql, [user_id, summary, JSON.stringify(vec)]);
};

export const recallLongTermMemory = async (user_id, query, topK = 3) => {
  if (!user_id) return [];
  
  // OPTIMIZATION: Early return if no query
  if (!query || query.length < 3) return [];
  
  let qVec = [];
  try {
    qVec = await embedText(query);
  } catch (e) {
    console.warn('[AI] Skip recallLongTermMemory embedding:', e.message);
    return [];
  }
  const [rows] = await db.query(`SELECT summary, embedding FROM ai_memory WHERE user_id=? LIMIT 10`, [user_id]);
  
  // Early return if no memory
  if (!rows || rows.length === 0) return [];
  
  const scored = rows.map(r => {
    let v = [];
    try { v = JSON.parse(r.embedding || '[]'); } catch {}
    const score = v.length ? cosineSim(qVec, v) : 0;
    return { summary: r.summary, score };
  }).sort((a,b)=>b.score-a.score);
  
  // Only return memories with meaningful similarity (> 0.5)
  return scored.filter(r => r.score > 0.5).slice(0, topK).map(r => r.summary);
};

export const clearUserAiData = async (user_id) => {
  if (!user_id) return;

  // Clear conversation rows bound to user_id and deterministic session id pattern.
  await db.query(
    `DELETE FROM ai_conversations WHERE user_id = ? OR session_id = ?`,
    [user_id, `u-${user_id}`]
  );

  // Clear long-term memory rows for this user.
  await db.query(
    `DELETE FROM ai_memory WHERE user_id = ?`,
    [user_id]
  );
};
