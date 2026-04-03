import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[AI] GEMINI_API_KEY is not set. AI endpoints will fail until configured.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Allow model override via env to support 2.5 / 2.5-flash if available
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

// `embedding-001` is no longer available on many projects; use a safer default.
const embedModelFromEnv = process.env.GEMINI_EMBED_MODEL;
const EMBED_MODEL = !embedModelFromEnv || embedModelFromEnv === 'embedding-001'
  ? 'text-embedding-004'
  : embedModelFromEnv;

if (embedModelFromEnv === 'embedding-001') {
  console.warn('[AI] GEMINI_EMBED_MODEL=embedding-001 is deprecated. Fallback to text-embedding-004.');
}

export const getChatModel = () => genAI.getGenerativeModel({ model: CHAT_MODEL });
export const getFastModel = () => genAI.getGenerativeModel({ model: CHAT_MODEL });
export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: EMBED_MODEL });
export const getChatModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: CHAT_MODEL, tools: [{ functionDeclarations }] });
export const getFastModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: CHAT_MODEL, tools: [{ functionDeclarations }] });
