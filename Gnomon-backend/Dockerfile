# Etapa 1: dependências (instala tudo, incl. dev)
FROM node:20-slim AS deps
WORKDIR /app
# Dependências do sistema (openssl é usado pelo Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci

LABEL maintainer="Joâo Marcos Ferreira Vilela"

# Etapa 2: build (gera Prisma Client e compila o TypeScript)
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gera o Prisma Client (não conecta no DB)
RUN npx prisma generate
# Build do projeto (ajuste se seu script for diferente)
RUN npm run build

# Etapa 3: runtime (imagem final, roda com usuário não-root)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Opcional: defina defaults (o provedor vai sobrescrever PORT)
ENV HOST=0.0.0.0
ENV PORT=3001

# Copia artefatos necessários
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Usuário não-root
RUN useradd -m -u 1001 nodejs && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Healthcheck sem precisar instalar curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>{if(r.ok)process.exit(0);process.exit(1)}).catch(()=>process.exit(1))"

# Roda migrações e sobe o servidor
# Ajuste o caminho do entrypoint se for diferente (ex.: dist/server.js)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
