import { Router } from 'express';
import { PrismaClient, LocalType } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Map:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         imageUrl:
 *           type: string
 *     Local:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - mapId
 *       properties:
 *         id:
 *           type: integer
 *           description: O ID gerado automaticamente do local.
 *         name:
 *           type: string
 *           description: Nome do local.
 *         description:
 *           type: string
 *           description: Descrição opcional do local.
 *         type:
 *           $ref: '#/components/schemas/LocalType'
 *         mapId:
 *           type: integer
 *           description: ID do mapa ao qual o local pertence.
 *     LocalType:
 *       type: string
 *       enum:
 *         - ENTRANCE
 *         - OFFICE
 *         - BATHROOM
 *         - PATIO
 *         - LIBRARY
 *         - LAB
 *         - AUDITORIUM
 *         - CANTEEN
 *         - STAFF_ROOM
 */

/**
 * @swagger
 * tags:
 *   name: Locals
 *   description: Gerenciamento de locais de interesse
 */

/**
 * @swagger
 * /api/locals:
 *   get:
 *     summary: Retorna todos os locais
 *     tags: [Locals]
 *     responses:
 *       200:
 *         description: Uma lista de locais.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Local'
 *       500:
 *         description: Erro no servidor.
 */
router.get('/', async (req, res) => {
  try {
    const locals = await prisma.local.findMany({
      include: { map: true },
    });
    res.json(locals);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    res.status(500).json({ message: 'Falha ao buscar os locais' });
  }
});

/**
 * @swagger
 * /api/locals:
 *   post:
 *     summary: Cria um novo local
 *     tags: [Locals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Local'
 *           example:
 *             name: "Recepção"
 *             description: "Entrada principal do prédio"
 *             type: "ENTRANCE"
 *             mapId: 1
 *     responses:
 *       201:
 *         description: Local criado com sucesso.
 *       400:
 *         description: Dados inválidos.
 */
router.post('/', async (req, res) => {
  try {
    const newLocal = await prisma.local.create({
      data: req.body,
    });
    res.status(201).json(newLocal);
  } catch (error) {
    console.error('Erro ao criar local:', error);
    res.status(400).json({ message: 'Não foi possível criar o local. Verifique os dados enviados.' });
  }
});

export default router;