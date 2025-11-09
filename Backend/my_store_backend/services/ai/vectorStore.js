import db from '../../db.js';
import { embedText, cosineSim } from './embeddings.js';

const parseVec = (s) => {
  try { return JSON.parse(s); } catch { return null; }
};

const getAssetBase = () => {
  if (process.env.NGROK_URL) return process.env.NGROK_URL.replace(/\/$/, '');
  if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/$/, '');
  return `http://localhost:${process.env.PORT || 3006}`;
};

export const normalizeImage = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const base = getAssetBase();
  if (img.startsWith('/')) return `${base}${img}`;
  return `${base}/${img}`;
};

export const upsertProductEmbedding = async (product) => {
  const text = `${product.name}\n${product.description || ''}`.trim();
  const vec = await embedText(text);
  await db.query(
    `REPLACE INTO product_embeddings (product_id, embedding) VALUES (?, ?)`,
    [product.id, JSON.stringify(vec)]
  );
};

export const ensureEmbeddingsForProducts = async (limit = 200) => {
  // Compute embeddings for products missing cache, bounded by limit
  const [missing] = await db.query(`
    SELECT p.* FROM product p
    LEFT JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE pe.product_id IS NULL
    LIMIT ?
  `, [limit]);
  
  if (missing.length === 0) return 0;
  
  // Generate embeddings with rate limiting (max 10 concurrent to avoid API throttle)
  const concurrentLimit = parseInt(process.env.EMBEDDING_CONCURRENT_LIMIT || '3');
  const delayBetweenBatches = parseInt(process.env.EMBEDDING_BATCH_DELAY || '500');
  
  let completed = 0;
  for (let i = 0; i < missing.length; i += concurrentLimit) {
    const batch = missing.slice(i, i + concurrentLimit);
    
    await Promise.all(
      batch.map(p => upsertProductEmbedding(p)
        .then(() => completed++)
        .catch(e => console.warn(`Failed embedding for product ${p.id}:`, e.message))
      )
    );
    
    // Delay between batches to respect rate limits (especially for free tier)
    if (i + concurrentLimit < missing.length) {
      await new Promise(r => setTimeout(r, delayBetweenBatches));
    }
  }
  
  return completed;
};

export const semanticSearchProducts = async (query, topK = 5) => {
  const qVec = await embedText(query);
  
  // OPTIMIZATION: Smart query strategy - use LIKE for Vietnamese text matching
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 3);
  const likeConditions = keywords.map(() => 'p.name LIKE CONCAT("%", ?, "%")').join(' OR ');
  const likeParams = keywords;
  
  // Fetch candidates with LIKE prefilter (faster than scanning all)
  const [candidates] = await db.query(
    `SELECT p.id, p.name, p.description, p.price, p.image, pe.embedding
     FROM product p
     LEFT JOIN product_embeddings pe ON pe.product_id = p.id
     ${likeConditions ? `WHERE ${likeConditions}` : ''}
     LIMIT 100`, // Reduced from 250 for speed
    likeParams
  );
  
  let pool = candidates;
  
  // If not enough candidates, get popular products as fallback
  if (pool.length < topK) {
    const [fallback] = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.image, pe.embedding
       FROM product p
       LEFT JOIN product_embeddings pe ON pe.product_id = p.id
       ORDER BY p.price ASC
       LIMIT ?`,
      [Math.max(50, topK * 10)] // Reduced from 500
    );
    pool = [...candidates, ...fallback];
  }

  // Compute similarity in JS (optimized)
  const scored = pool.map((r) => {
    const v = parseVec(r.embedding);
    const image = normalizeImage(r.image);
    if (!v || v.length === 0) return { ...r, image, score: 0 };
    return { ...r, image, score: cosineSim(qVec, v) };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
};
