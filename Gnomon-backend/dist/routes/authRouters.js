"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================
/**
 * @route   POST /api/auth/login
 * @desc    Autenticação de admin/staff
 * @access  Público
 */
router.post('/login', AuthController_1.loginUser);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicita link de recuperação de senha
 * @access  Público
 */
router.post('/forgot-password', AuthController_1.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefine senha com token
 * @access  Público
 */
router.post('/reset-password', AuthController_1.resetPassword);
// ========================================
// ROTAS PROTEGIDAS (requer token JWT)
// ========================================
/**
 * @route   GET /api/auth/profile
 * @desc    Retorna perfil do usuário autenticado
 * @access  Privado
 */
router.get('/profile', authMiddleware_1.authMiddleware, AuthController_1.getUserProfile);
exports.default = router;
