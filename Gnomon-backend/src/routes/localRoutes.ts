import { Router } from 'express';
import {
  getAllLocais,
  getLocalById,
  createLocal,
  updateLocal,
  deleteLocal,
} from '../controllers/LocalController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rotas públicas
router.get('/', getAllLocais);
router.get('/:id', getLocalById);

// Rotas protegidas (Admin/Staff)
router.post('/', authMiddleware, createLocal);
router.put('/:id', authMiddleware, updateLocal);
router.delete('/:id', authMiddleware, deleteLocal);

export default router;