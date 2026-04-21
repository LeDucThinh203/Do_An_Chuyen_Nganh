import express from 'express';
import * as supportChatController from '../controllers/supportChatController.js';
import { authenticate, requireAdmin, requireUser } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/rooms/ensure', requireUser, supportChatController.ensureRoom);
router.get('/rooms', requireAdmin, supportChatController.listRooms);
router.get('/messages/:roomId', requireUser, supportChatController.getMessagesByRoom);
router.post('/messages', requireUser, supportChatController.sendMessage);
router.post('/rooms/mark-read', requireUser, supportChatController.markRoomRead);

export default router;
