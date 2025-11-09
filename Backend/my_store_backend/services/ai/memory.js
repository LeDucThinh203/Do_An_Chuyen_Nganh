import db from '../../db.js';
import { embedText, cosineSim } from './embeddings.js';

export const saveMessage = async ({ session_id, user_id, role, content, tool_name = null, tool_payload = null }) => {
  await db.query(
    `INSERT INTO ai_conversations (session_id, user_id, role, content, tool_name, tool_payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [session_id, user_id || null, role, content || null, tool_name, tool_payload ? JSON.stringify(tool_payload) : null]
  );
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
  const vec = await embedText(summary);
  const sql = `
    INSERT INTO ai_memory (user_id, summary, embedding, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      summary = VALUES(summary),
      embedding = VALUES(embedding),
      updated_at = NOW()
  `;
  await db.query(sql, [user_id, summary, JSON.stringify(vec)]);
};

export const recallLongTermMemory = async (user_id, query, topK = 3) => {
  if (!user_id) return [];
  
  // OPTIMIZATION: Early return if no query
  if (!query || query.length < 3) return [];
  
  const qVec = await embedText(query);
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
