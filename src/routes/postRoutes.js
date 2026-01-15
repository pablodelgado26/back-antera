import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment
} from '../controllers/postController.js';

const router = Router();

// Rotas de posts
router.post('/', authMiddleware, createPost);
router.get('/', authMiddleware, getAllPosts);
router.get('/:id', authMiddleware, getPostById);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Likes
router.post('/:id/like', authMiddleware, toggleLike);

// Comentários
router.post('/:id/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

export default router;
