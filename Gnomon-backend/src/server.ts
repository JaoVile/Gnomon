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
import userRoutes from './routes/userRoutes';
import localRoutes from './routes/localRoutes';

// Configurações de e-mail
import { mailer, verifySMTP } from './config/mail';

// Swagger
import { setupSwagger } from './docs/swagger';


const app = express();

app.set('mailer', mailer);
if (process.env.NODE_ENV !== 'production') {
  verifySMTP(); // opcional, só para validar credenciais em dev
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
app.use(helmet());

// CORS: aceita lista CSV (CORS_ORIGIN ou FRONTEND_URL), ex: "https://site.com,http://localhost:5173"
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
      // permite ferramentas sem Origin (curl, health checks)
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Rate limit (parametrizável por env)
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000); // 15min
const max = Number(process.env.RATE_LIMIT_MAX ?? 300); // 300 req/IP
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
    // Nível pode ser controlado por LOG_LEVEL (info|debug...)
    level: process.env.LOG_LEVEL || 'info',
    // Em dev dá para deixar mais bonito com pino-pretty via transport (opcional)
  })
);

// Health check simples
app.get('/', (_req, res) => res.send('<h1>API do Gnomon está no ar!</h1>'));
app.get('/health', (_req, res) => res.json({ ok: true }));

// Swagger
setupSwagger(app);

// Rotas de domínio
app.use('/api/users', userRoutes);
app.use('/api/locais', localRoutes);

// 404 para rotas não encontradas
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

// Middleware de erro (último)
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Se tiver pino-http, use req.log
    if ((req as any).log) (req as any).log.error(err);
    else console.error(err);

    return res.status(500).json({
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  }
);

export default app;