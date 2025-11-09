import express from 'express';
import { chat, history } from '../controllers/aiController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AI
 *     description: Trợ lý Gemini (RAG + Memory + Tools)
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Trò chuyện với trợ lý AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               userId:
 *                 type: integer
 *               sessionId:
 *                 type: string
 *               topK:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Kết quả trả lời của AI
 */
router.post('/chat', chat);

/**
 * @swagger
 * /ai/history:
 *   get:
 *     summary: Lấy lịch sử hội thoại của một session
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lịch sử hội thoại
 */
router.get('/history', history);

export default router;
