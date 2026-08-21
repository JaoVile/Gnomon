"use strict";
/**
 * @file server.ts
 * @description Configura e exporta a instância do Express (sem dar listen).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pino_http_1 = __importDefault(require("pino-http"));
// Rotas
const authRouters_1 = __importDefault(require("./routes/authRouters"));
// Configurações de e-mail
const mail_1 = require("./config/mail");
// Swagger
const swagger_1 = require("./middleware/docs/swagger");
const app = (0, express_1.default)();
// Configuração de e-mail
app.set('mailer', mail_1.mailer);
if (process.env.NODE_ENV !== 'production') {
    (0, mail_1.verifySMTP)();
}
// Trust proxy
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// Segurança básica
app.use((0, helmet_1.default)());
// CORS
const allowed = (process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (allowed.includes(origin))
            return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Body parser
app.use(express_1.default.json());
// Rate limit
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 300);
app.use((0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Logger HTTP
app.use((0, pino_http_1.default)({
    level: process.env.LOG_LEVEL || 'info',
}));
// Health check
/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check raiz
 *     responses:
 *       200:
 *         description: API online
 */
app.get('/', (_req, res) => res.send('<h1>API do Gnomon está no ar! 🚀</h1>'));
/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check JSON
 *     responses:
 *       200:
 *         description: Status da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 */
app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
// ✅ Swagger ANTES das rotas de domínio
(0, swagger_1.setupSwagger)(app);
/**
 * @openapi
 * /api/hello:
 *   get:
 *     description: A simple test endpoint.
 *     responses:
 *       200:
 *         description: Returns a hello message.
 */
app.get('/api/hello', (_req, res) => res.json({ message: 'Hello, Swagger!' }));
// ✅ Rotas de domínio (PADRONIZADAS em inglês)
app.use('/api/auth', authRouters_1.default);
// 404 para rotas não encontradas
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
// Middleware de erro (último)
app.use((err, req, res, _next) => {
    if (req.log)
        req.log.error(err);
    else
        console.error('❌ Erro:', err);
    return res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
});
exports.default = app;
