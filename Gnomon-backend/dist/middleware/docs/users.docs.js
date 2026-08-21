"use strict";
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticação
 *     summary: Login de Admin/Staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
Object.defineProperty(exports, "__esModule", { value: true });
