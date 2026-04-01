import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[AI] GEMINI_API_KEY is not set. AI endpoints will fail until configured.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Allow model override via env to support 2.5 / 2.5-flash if available
const CHAT_MODEL = 'gemini-2.5-flash' ;
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'embedding-001';

export const getChatModel = () => genAI.getGenerativeModel({ model: CHAT_MODEL });
export const getFastModel = () => genAI.getGenerativeModel({ model: CHAT_MODEL });
export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: EMBED_MODEL });
export const getChatModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: CHAT_MODEL, tools: [{ functionDeclarations }] });
export const getFastModelWithTools = (functionDeclarations) =>
  genAI.getGenerativeModel({ model: CHAT_MODEL, tools: [{ functionDeclarations }] });
