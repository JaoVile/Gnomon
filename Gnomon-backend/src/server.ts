/**
 * @file server.ts
 * @description Configura e exporta a instância do Express (sem dar listen).
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

// Rotas
import authRoutes from './routes/authRouters';
import localRoutes from './routes/localRoutes';

// Configurações de e-mail
import { mailer, verifySMTP } from './config/mail';

// Swagger
import { setupSwagger } from './middleware/docs/swagger';

const app = express();

// Configuração de e-mail
app.set('mailer', mailer);
if (process.env.NODE_ENV !== 'production') {
  verifySMTP();
}

// Trust proxy
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Segurança básica
app.use(helmet());

// CORS
const allowed = (
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Rate limit
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 300);
app.use(
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Logger HTTP
app.use(
  pinoHttp({
    level: process.env.LOG_LEVEL || 'info',
  })
);

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
app.get('/health', (_req, res) => 
  res.json({ ok: true, timestamp: new Date().toISOString() })
);

// ✅ Swagger ANTES das rotas de domínio
setupSwagger(app);

app.get('/api/test', (_req, res) => res.json({ message: 'Test route works!' }));

// ✅ Rotas de domínio (PADRONIZADAS em inglês)
app.use('/api/auth', authRoutes);
app.use('/api/locals', localRoutes); // ✅ MUDEI DE /locais para /locals (padrão REST em inglês)

// 404 para rotas não encontradas
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

// Middleware de erro (último)
app.use(
  (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if ((req as any).log) (req as any).log.error(err);
    else console.error('❌ Erro:', err);

    return res.status(500).json({
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  }
);

export default app;