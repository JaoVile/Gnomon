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
/**
 * @openapi
 * /api/locals:
 *   get:
 *     tags:
 *       - Locais
 *     summary: Retorna todos os locais
 *     responses:
 *       200:
 *         description: Uma lista de locais.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Local'
 *       401:
 *         description: Não autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllLocais);

/**
 * @openapi
 * /api/locals/{id}:
 *   get:
 *     tags:
 *       - Locais
 *     summary: Retorna um local pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do local
 *     responses:
 *       200:
 *         description: Detalhes do local.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Local'
 *       404:
 *         description: Local não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getLocalById);

// Rotas protegidas (Admin/Staff)
/**
 * @openapi
 * /api/locals:
 *   post:
 *     tags:
 *       - Locais
 *     summary: Cria um novo local (requer autenticação)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLocalRequest'
 *     responses:
 *       201:
 *         description: Local criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Local'
 *       400:
 *         description: Dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authMiddleware, createLocal);

/**
 * @openapi
 * /api/locals/{id}:
 *   put:
 *     tags:
 *       - Locais
 *     summary: Atualiza um local existente pelo ID (requer autenticação)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do local
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLocalRequest' # Reutilizando para update
 *     responses:
 *       200:
 *         description: Local atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Local'
 *       400:
 *         description: Dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Local não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authMiddleware, updateLocal);

/**
 * @openapi
 * /api/locals/{id}:
 *   delete:
 *     tags:
 *       - Locais
 *     summary: Deleta um local pelo ID (requer autenticação)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do local
 *     responses:
 *       204:
 *         description: Local deletado com sucesso.
 *       401:
 *         description: Não autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Local não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authMiddleware, deleteLocal);

export default router;