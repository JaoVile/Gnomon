import path from 'node:path';
import helmet from 'helmet';
import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express'; // compat sem esModuleInterop
import swaggerJSDoc, { Options } from 'swagger-jsdoc';

export function setupSwagger(app: Express) {
  const baseUrl =
    process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

  const options: Options = {
    definition: {
      openapi: '3.0.0',
      info: { title: 'Gnomon API', version: '1.0.0' },
      servers: [{ url: baseUrl }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      // Descomente se a maioria das rotas exigir auth (JWT) por padrão:
      // security: [{ bearerAuth: [] }],
    },
    apis: [
      // Código-fonte
      path.join(process.cwd(), 'src', 'server.ts'),
      path.join(process.cwd(), 'src', 'routes', '**', '*.ts'),
      path.join(process.cwd(), 'src', 'controllers', '**', '*.ts'),
      path.join(process.cwd(), 'src', 'docs', '**', '*.ts'),
      path.join(process.cwd(), 'src', 'docs', '**', '*.yaml'),
      path.join(process.cwd(), 'src', 'docs', '**', '*.yml'),

      // Build (produção)
      path.join(process.cwd(), 'dist', 'server.js'),
      path.join(process.cwd(), 'dist', 'routes', '**', '*.js'),
      path.join(process.cwd(), 'dist', 'controllers', '**', '*.js'),
      path.join(process.cwd(), 'dist', 'docs', '**', '*.js'),
    ],
  };

  const specs = swaggerJSDoc(options);

  // JSON para depuração
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // CSP mais permissiva só na UI do Swagger (por causa do Helmet)
  const cspDefaults = helmet.contentSecurityPolicy.getDefaultDirectives();
  app.use(
    '/api/docs',
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        ...cspDefaults,
        'script-src': ["'self'", "'unsafe-inline'", 'https:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      },
    }),
    swaggerUi.serve,
    swaggerUi.setup(specs, { explorer: true })
  );

  console.log(`📚 Swagger docs: ${baseUrl}/api/docs`);
}