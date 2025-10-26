/**
 * @file index.ts
 * @description Entrypoint: carrega .env, inicia o servidor e trata sinais/erros globais.
 */

import 'dotenv/config';
import app from './server';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

// Opcional: reforça trust proxy via env (alternativa ao que está no server.ts)
// if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Sobe o servidor
const server = app.listen(port, host, () => {
  const base = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
  console.log(`🚀 API rodando em: ${base}`);
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const docsPath = process.env.SWAGGER_PATH || '/api-docs';
    console.log(`📚 Swagger: ${base}${docsPath}`);
  }
});

// Erros não tratados
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Em produção, opcional fechar o servidor de forma controlada:
  // process.exit(1);
});

// Encerramento gracioso
['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => {
    console.log(`Recebido ${sig}. Encerrando...`);
    server.close(() => {
      console.log('Servidor encerrado.');
      process.exit(0);
    });
  });
});