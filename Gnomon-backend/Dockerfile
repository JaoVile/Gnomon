# Etapa 1: Builder (instala tudo, compila e prepara para produção)
FROM node:20-slim AS builder
WORKDIR /app

# Dependências do sistema (openssl é usado pelo Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de definição de dependências
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copia o resto do código-fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila o TypeScript para JavaScript
RUN npm run build

# Remove as dependências de desenvolvimento para a imagem final
RUN npm prune --production

# Etapa 2: Runner (imagem final, leve e segura)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Cria um usuário não-root para segurança
RUN useradd -m -u 1001 nodejs

# Copia os artefatos de produção da etapa de build, já definindo o dono correto
COPY --from=builder --chown=nodejs:nodejs /app .

# Troca para o usuário não-root
USER nodejs

EXPOSE 3001

# Comando final para iniciar o servidor. Simples e direto.
CMD ["node", "dist/index.js"]
