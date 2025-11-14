import { Router } from 'express';
import {
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
} from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================

/**
 * @route   POST /api/auth/login
 * @desc    Autenticação de admin/staff
 * @access  Público
 */
router.post('/login', loginUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicita link de recuperação de senha
 * @access  Público
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefine senha com token
 * @access  Público
 */
router.post('/reset-password', resetPassword);

// ========================================
// ROTAS PROTEGIDAS (requer token JWT)
// ========================================

/**
 * @route   GET /api/auth/profile
 * @desc    Retorna perfil do usuário autenticado
 * @access  Privado
 */
router.get('/profile', authMiddleware, getUserProfile);

export default router;