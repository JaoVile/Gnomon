/**
 * @file index.ts
 * @description Entrypoint: carrega .env, inicia o servidor e trata sinais/erros globais.
 */

import 'dotenv/config';
import app from './server';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

// Sobe o servidor
const server = app.listen(port, host, () => {
  const base = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
  console.log(`🚀 API rodando em: ${base}`);
  // ❌ REMOVER ESSE LOG - Swagger já imprime no server.ts
});

// Erros não tratados
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Encerramento gracioso
['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => {
    console.log(`⚠️ Recebido ${sig}. Encerrando...`);
    server.close(() => {
      console.log('✅ Servidor encerrado.');
      process.exit(0);
    });
  });
});