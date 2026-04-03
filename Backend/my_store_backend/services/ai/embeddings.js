import { getEmbeddingModel, getEmbeddingModelByName, getEmbeddingModelCandidates } from './gemini.js';

// OPTIMIZATION: Simple in-memory cache for embeddings (LRU with max 100 entries)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 100;
let embeddingDisabled = false;
let workingEmbeddingModel = null;

const getCacheKey = (text) => {
  // Normalize text for cache key
  return text.trim().toLowerCase().slice(0, 500);
};

const cleanCache = () => {
  if (embeddingCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first 20)
    const entries = Array.from(embeddingCache.keys());
    entries.slice(0, 20).forEach(key => embeddingCache.delete(key));
  }
};

export const embedText = async (text) => {
  if (embeddingDisabled) return [];

  const cacheKey = getCacheKey(text);
  
  // Check cache first
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }
  
  const candidates = workingEmbeddingModel
    ? [workingEmbeddingModel, ...getEmbeddingModelCandidates().filter(m => m !== workingEmbeddingModel)]
    : getEmbeddingModelCandidates();

  let embedding = [];
  let lastError;

  for (const modelName of candidates) {
    try {
      const model = modelName ? getEmbeddingModelByName(modelName) : getEmbeddingModel();
      const res = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
      });

      embedding = res?.embedding?.values || res?.data?.embedding?.values || [];
      if (embedding.length > 0) {
        workingEmbeddingModel = modelName;
        break;
      }
    } catch (e) {
      lastError = e;
      const msg = e?.message || '';
      if (e?.status === 404 || msg.includes('404')) {
        continue;
      }
      throw e;
    }
  }

  if (!embedding.length) {
    embeddingDisabled = true;
    console.warn('[AI] Embedding disabled: no supported embedding model available for this API key/project.');
    if (lastError?.message) {
      console.warn('[AI] Last embedding error:', lastError.message);
    }
    return [];
  }
  
  // Store in cache
  embeddingCache.set(cacheKey, embedding);
  cleanCache();
  
  return embedding;
};

export const cosineSim = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};
