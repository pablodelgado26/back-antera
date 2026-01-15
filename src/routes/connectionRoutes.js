import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getUserConnections,
  getPendingRequests,
  removeConnection,
  checkConnectionStatus
} from '../controllers/connectionController.js';

const router = Router();

router.post('/', authMiddleware, sendConnectionRequest);
router.get('/', authMiddleware, getUserConnections);
router.get('/pending', authMiddleware, getPendingRequests);
router.get('/status/:otherUserId', authMiddleware, checkConnectionStatus);
router.patch('/:id/accept', authMiddleware, acceptConnection);
router.patch('/:id/reject', authMiddleware, rejectConnection);
router.delete('/:id', authMiddleware, removeConnection);

export default router;
