/**
 * @openapi
 * /api/locals:
 *   get:
 *     tags:
 *       - Locais
 *     summary: Listar todos os locais
 *     description: Retorna lista de locais com filtros opcionais (público)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo (CLASSROOM, LABORATORY, etc)
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filtrar por andar
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *         description: Filtrar por prédio
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou código
 *     responses:
 *       200:
 *         description: Lista de locais
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Local'
 *   
 *   post:
 *     tags:
 *       - Locais
 *     summary: Criar novo local
 *     description: Apenas Admin/Staff autenticado
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
 *         description: Local criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Local'
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /api/locals/{id}:
 *   get:
 *     tags:
 *       - Locais
 *     summary: Buscar local por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes do local
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Local'
 *       404:
 *         description: Local não encontrado
 */

export {};