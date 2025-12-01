import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Maps
 *   description: Gerenciamento de mapas
 */

/**
 * @swagger
 * /api/maps:
 *   get:
 *     summary: Retorna todos os mapas
 *     tags: [Maps]
 *     responses:
 *       200:
 *         description: Lista de mapas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Map'
 */
router.get('/', async (req, res) => {
  try {
    const maps = await prisma.map.findMany();
    res.json(maps);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar os mapas.' });
  }
});

/**
 * @swagger
 * /api/maps/{id}:
 *   get:
 *     summary: Retorna um mapa pelo ID
 *     tags: [Maps]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do mapa
 *     responses:
 *       200:
 *         description: Detalhes do mapa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Map'
 *       404:
 *         description: Mapa não encontrado
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const map = await prisma.map.findUnique({
      where: { id: parseInt(id) },
      include: { locals: true }, // Inclui os locais associados
    });
    if (map) {
      res.json(map);
    } else {
      res.status(404).json({ error: 'Mapa não encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar o mapa.' });
  }
});

/**
 * @swagger
 * /api/maps:
 *   post:
 *     summary: Cria um novo mapa
 *     tags: [Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *             example:
 *               name: "Térreo"
 *               imageUrl: "http://example.com/map.png"
 *     responses:
 *       201:
 *         description: Mapa criado com sucesso
 */
router.post('/', async (req, res) => {
  const { name, imageUrl } = req.body;
  try {
    const newMap = await prisma.map.create({
      data: { name, imageUrl },
    });
    res.status(201).json(newMap);
  } catch (error) {
    res.status(400).json({ error: 'Falha ao criar o mapa. Verifique os dados enviados.' });
  }
});

export default router;