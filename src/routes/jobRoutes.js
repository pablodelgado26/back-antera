import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  deactivateJob
} from '../controllers/jobController.js';

const router = Router();

router.post('/', authMiddleware, createJob);
router.get('/', authMiddleware, getAllJobs);
router.get('/:id', authMiddleware, getJobById);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);
router.patch('/:id/deactivate', authMiddleware, deactivateJob);

export default router;
