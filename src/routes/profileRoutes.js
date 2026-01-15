import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addSkill,
  removeSkill,
  searchUsers
} from '../controllers/profileController.js';

const router = Router();

// Perfil
router.get('/search', authMiddleware, searchUsers);
router.get('/:id', authMiddleware, getUserProfile);
router.put('/', authMiddleware, updateProfile);

// Experiências
router.post('/experiences', authMiddleware, addExperience);
router.put('/experiences/:id', authMiddleware, updateExperience);
router.delete('/experiences/:id', authMiddleware, deleteExperience);

// Educação
router.post('/educations', authMiddleware, addEducation);
router.delete('/educations/:id', authMiddleware, deleteEducation);

// Skills
router.post('/skills', authMiddleware, addSkill);
router.delete('/skills/:id', authMiddleware, removeSkill);

export default router;
