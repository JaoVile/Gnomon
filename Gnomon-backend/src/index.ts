/**
 * @file index.ts
 * @description Entrypoint: Inicia o servidor de forma segura para o Cloud Run.
 */

import 'dotenv/config';

// Log imediato para provar que o script começou a rodar
console.log('🏁 Iniciando script de entrada (index.ts)...');

// Tratamento de erros globais IMEDIATO (antes de importar o app)
// Isso pega erros caso o import do ./server falhe (ex: erro no prisma client na inicialização)
process.on('uncaughtException', (err) => {
  console.error('❌ CRASH FATAL (Uncaught Exception):', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ CRASH FATAL (Unhandled Rejection):', reason);
  process.exit(1);
});

// Importa o app DEPOIS dos handlers de erro
import app from './server';

// Garante que a porta seja um número inteiro
const PORT = parseInt(process.env.PORT || '3001', 10);
// OBRIGATÓRIO PARA CLOUD RUN:
const HOST = '0.0.0.0'; 

console.log(`🔌 Configurando para escutar em: ${HOST}:${PORT}`);

// Inicia o servidor explicitando o HOST
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 SERVIDOR RODANDO!`);
  console.log(`👉 URL Interna: http://${HOST}:${PORT}`);
  console.log(`👉 Ambiente: ${process.env.NODE_ENV}`);
});

// Graceful Shutdown (Essencial para Cloud Run)
const shutdown = (signal: string) => {
  console.log(`⚠️ Recebido sinal ${signal}. Fechando servidor HTTP...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar servidor:', err);
      process.exit(1);
    }
    console.log('✅ Servidor HTTP fechado.');
    process.exit(0);
  });
  
  // Força o encerramento se o server.close travar (ex: conexões presas)
  setTimeout(() => {
    console.error('🛑 Forçando encerramento após timeout...');
    process.exit(1);
  }, 10000); // 10 segundos
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));