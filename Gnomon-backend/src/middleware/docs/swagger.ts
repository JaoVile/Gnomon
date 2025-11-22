import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// IMPORTANTE: Ajuste de caminhos para Windows e Linux
// __dirname aqui é: .../Gnomon-backend/src/middleware/docs/
const routesPath = path.join(__dirname, '../../routes/*.{ts,js}');
const serverPath = path.join(__dirname, '../../server.{ts,js}');
const controllersPath = path.join(__dirname, '../../controllers/*.{ts,js}');

// Debug: Mostra no terminal onde ele está procurando
console.log('🔍 Swagger buscando rotas em:', routesPath.replace(/\\/g, '/'));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gnomon API',
      version: '1.0.0',
      description: 'API do sistema Gnomon',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Servidor Local',
      },
    ],
  },
  // AQUI ESTÁ O SEGREDO:
  apis: [
    routesPath.replace(/\\/g, '/'),      // Pega src/routes
    serverPath.replace(/\\/g, '/'),      // Pega src/server.ts
    controllersPath.replace(/\\/g, '/')  // Pega controllers
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Endpoint JSON (se quiser ver os dados brutos)
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  // CORREÇÃO DO ERRO DE TYPE:
  // Usamos (swaggerSpec as any) para dizer ao TS que sabemos que 'paths' existe
  const paths = (swaggerSpec as any).paths || {};
  const rotasEncontradas = Object.keys(paths).length;

  console.log(`📚 Swagger UI: http://localhost:${process.env.PORT || 3001}/api/docs`);
  console.log(`✅ Rotas documentadas encontradas: ${rotasEncontradas}`);
};