import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getOrCreateConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markAsRead,
  getUnreadCount
} from '../controllers/messageController.js';

const router = Router();

router.get('/conversations', authMiddleware, getUserConversations);
router.get('/conversations/:otherUserId', authMiddleware, getOrCreateConversation);
router.post('/conversations/:conversationId/messages', authMiddleware, sendMessage);
router.get('/conversations/:conversationId/messages', authMiddleware, getConversationMessages);
router.patch('/conversations/:conversationId/read', authMiddleware, markAsRead);
router.get('/unread-count', authMiddleware, getUnreadCount);

export default router;
