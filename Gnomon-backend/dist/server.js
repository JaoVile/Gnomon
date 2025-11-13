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
const localRoutes_1 = __importDefault(require("./routes/localRoutes"));
// Configurações de e-mail
const mail_1 = require("./config/mail");
// Swagger
const swagger_1 = require("./middleware/docs/swagger");
const app = (0, express_1.default)();
app.set('mailer', mail_1.mailer);
if (process.env.NODE_ENV !== 'production') {
    (0, mail_1.verifySMTP)(); // opcional, só para validar credenciais em dev
}
/**
 * Trust proxy:
 * - Ligue se estiver atrás de Nginx/Cloudflare/Render/etc.
 * - Controle por env no index.ts (opcional) ou aqui via variável.
 */
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
// Segurança básica
app.use((0, helmet_1.default)());
// CORS: aceita lista CSV (CORS_ORIGIN ou FRONTEND_URL), ex: "https://site.com,http://localhost:5173"
const allowed = (process.env.CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        // permite ferramentas sem Origin (curl, health checks)
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
// Rate limit (parametrizável por env)
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000); // 15min
const max = Number(process.env.RATE_LIMIT_MAX ?? 300); // 300 req/IP
app.use((0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Logger HTTP
app.use((0, pino_http_1.default)({
    // Nível pode ser controlado por LOG_LEVEL (info|debug...)
    level: process.env.LOG_LEVEL || 'info',
    // Em dev dá para deixar mais bonito com pino-pretty via transport (opcional)
}));
// Health check simples
app.get('/', (_req, res) => res.send('<h1>API do Gnomon está no ar!</h1>'));
app.get('/health', (_req, res) => res.json({ ok: true }));
// Swagger
(0, swagger_1.setupSwagger)(app);
// Rotas de domínio
app.use('/api/auth', authRouters_1.default);
app.use('/api/locais', localRoutes_1.default);
// 404 para rotas não encontradas
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
// Middleware de erro (último)
app.use(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
(err, req, res, _next) => {
    // Se tiver pino-http, use req.log
    if (req.log)
        req.log.error(err);
    else
        console.error(err);
    return res.status(500).json({
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
});
exports.default = app;
