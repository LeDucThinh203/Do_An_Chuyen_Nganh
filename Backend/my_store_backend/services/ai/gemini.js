import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[AI] GEMINI_API_KEY is not set. AI endpoints will fail until configured.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Allow model override via env to support 2.5 / 2.5-flash if available
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-2.5-flash';

// `embedding-001` is no longer available on many projects; use a safer default.
const sanitizeModelName = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/^models\//i, '').toLowerCase();
};

const rawEmbedModel = process.env.GEMINI_EMBED_MODEL;
const normalizedEmbedModel = sanitizeModelName(rawEmbedModel);
const EMBED_MODEL = !normalizedEmbedModel || normalizedEmbedModel === 'embedding-001'
  ? 'text-embedding-004'
  : normalizedEmbedModel;

const EMBED_FALLBACK_MODELS = [
  EMBED_MODEL,
  'gemini-embedding-001',
  'text-embedding-004'
].filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index);

if (normalizedEmbedModel === 'embedding-001') {
  console.warn('[AI] GEMINI_EMBED_MODEL is deprecated (embedding-001). Fallback to text-embedding-004.');
}

console.log(`[AI] Models -> chat: ${CHAT_MODEL}, fast: ${FAST_MODEL}, embed: ${EMBED_MODEL}`);

export const getChatModel = () => genAI.getGenerativeModel({ model: CHAT_MODEL });
export const getFastModel = () => genAI.getGenerativeModel({ model: FAST_MODEL });
export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: EMBED_MODEL });
export const getEmbeddingModelByName = (modelName) => genAI.getGenerativeModel({ model: modelName });
export const getEmbeddingModelCandidates = () => EMBED_FALLBACK_MODELS;
export const getChatModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: CHAT_MODEL, tools: [{ functionDeclarations }] });
export const getFastModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: FAST_MODEL, tools: [{ functionDeclarations }] });
