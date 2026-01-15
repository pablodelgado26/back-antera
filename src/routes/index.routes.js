import express from "express"

// Importar todas as rotas
import authRouter from "./auth.routes.js"
import postRoutes from './postRoutes.js';
import jobRoutes from './jobRoutes.js';
import messageRoutes from './messageRoutes.js';
import connectionRoutes from './connectionRoutes.js';
import profileRoutes from './profileRoutes.js';
import companyRoutes from './companyRoutes.js';

import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Antera Chat API - LinkedIn-like Social Network',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

//Rotas públicas
router.use("/auth", authRouter);

//Rotas protegidas (necessitam autenticação)
router.use('/posts', postRoutes);
router.use('/jobs', jobRoutes);
router.use('/messages', messageRoutes);
router.use('/connections', connectionRoutes);
router.use('/profile', profileRoutes);
router.use('/companies', companyRoutes);

export default router