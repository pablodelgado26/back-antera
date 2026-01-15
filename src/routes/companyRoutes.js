import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} from '../controllers/companyController.js';

const router = Router();

router.post('/', authMiddleware, createCompany);
router.get('/', authMiddleware, getAllCompanies);
router.get('/:id', authMiddleware, getCompanyById);
router.put('/:id', authMiddleware, updateCompany);
router.delete('/:id', authMiddleware, deleteCompany);

export default router;
