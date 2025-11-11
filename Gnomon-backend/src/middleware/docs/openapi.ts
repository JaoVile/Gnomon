/**
 * @openapi
 * tags:
 *   - name: Health
 *     description: Health check da API
 *   - name: Autenticação
 *     description: Login, recuperação de senha e perfil
 *   - name: Locais
 *     description: CRUD de locais (salas, labs, etc)
 *   - name: Navegação
 *     description: Cálculo de rotas e pathfinding
 *   - name: Grafo
 *     description: Nós e arestas do grafo de navegação
 */

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   
 *   schemas:
 *     # ===== AUTENTICAÇÃO =====
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, STAFF]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@gnomon.app"
 *         password:
 *           type: string
 *           format: password
 *           example: "senha123"
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *     
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     
 *     ResetPasswordRequest:
 *       type: object
 *       required: [email, token, password]
 *       properties:
 *         email:
 *           type: string
 *         token:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 6
 *     
 *     # ===== LOCAIS =====
 *     Local:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           example: "Laboratório de Informática 101"
 *         description:
 *           type: string
 *         code:
 *           type: string
 *           example: "LAB-101"
 *         type:
 *           type: string
 *           enum: [CLASSROOM, LABORATORY, BATHROOM, OFFICE, LIBRARY, CAFETERIA, AUDITORIUM, ENTRANCE, STAIRS, ELEVATOR, PARKING, OTHER]
 *         x:
 *           type: number
 *           format: float
 *         y:
 *           type: number
 *           format: float
 *         z:
 *           type: number
 *           format: float
 *         floor:
 *           type: integer
 *         building:
 *           type: string
 *         iconUrl:
 *           type: string
 *         imageUrl:
 *           type: string
 *         accessible:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         mapId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateLocalRequest:
 *       type: object
 *       required: [name, type, x, y, mapId]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         code:
 *           type: string
 *         type:
 *           type: string
 *           enum: [CLASSROOM, LABORATORY, BATHROOM, OFFICE, LIBRARY, CAFETERIA, AUDITORIUM, ENTRANCE, STAIRS, ELEVATOR, PARKING, OTHER]
 *         x:
 *           type: number
 *         y:
 *           type: number
 *         z:
 *           type: number
 *         floor:
 *           type: integer
 *         building:
 *           type: string
 *         iconUrl:
 *           type: string
 *         imageUrl:
 *           type: string
 *         accessible:
 *           type: boolean
 *         mapId:
 *           type: integer
 *     
 *     # ===== ERROS =====
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 */

export {};