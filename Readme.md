Segue o conteúdo pronto para salvar como README.md.

# Gnomon — Navegação e Integração no Campus

> PWA para orientar alunos e visitantes no campus, com mapa interativo, catálogo de locais e autenticação.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-black?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-React-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Sumário
- [Visão Geral](#visão-geral)
- [Justificativa](#justificativa)
- [Solução Técnica (PWA)](#solução-técnica-pwa)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias e Arquitetura](#-tecnologias-e-arquitetura)
- [🚀 Como Rodar (Ambiente de Desenvolvimento)](#-como-rodar-ambiente-de-desenvolvimento)
- [🔧 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [🗃️ Banco de Dados e Prisma](#-banco-de-dados-e-prisma)
- [📖 Swagger (Documentação da API)](#-swagger-documentação-da-api)
- [Escopo do Projeto](#escopo-do-projeto)
- [Modelo de Negócio (Futuro)](#modelo-de-negócio-futuro)
- [Equipe](#equipe)
- [Licença](#licença)

---

## Visão Geral
O Projeto Gnomon é uma iniciativa acadêmica (TCC — UNINASSAU) que resolve a dificuldade de orientação espacial de novos alunos e visitantes no campus. Por meio de um Aplicativo Web Progressivo (PWA), o projeto oferece uma solução digital, autônoma e sempre disponível — eliminando a dependência de mapas impressos desatualizados ou de pedir informações a terceiros.

O nome “Gnomon” reflete sua função: atuar como guia confiável, tal qual o gnomon de um relógio solar.

---

## Justificativa
A transição para a universidade traz desafios além da localização: gestão de tempo, carga de disciplinas e pressão pessoal. A dificuldade inicial em se orientar no campus agrava esses problemas e consome energia que poderia ser dedicada às demandas acadêmicas e sociais.

- O campus pode ser um verdadeiro “labirinto” para recém-chegados.
- Uma pesquisa indicou que 66,4% dos estudantes relataram falta de informações essenciais (assistência estudantil, saúde, serviços administrativos).

O Gnomon simplifica a navegação, promovendo autonomia e segurança, e acelera a adaptação do usuário ao ambiente acadêmico.

---

## Solução Técnica (PWA)
A escolha por um PWA torna a solução acessível via navegador, instalável na tela inicial do celular e com uma experiência de uso semelhante a um aplicativo nativo, sem a necessidade de uma loja de aplicativos.

- Acessibilidade: Compatível com múltiplas plataformas (iOS, Android, Web).
- Performance: Leve e rápido, construído com Vite e React.
- Disponibilidade: Preparado para uso offline (escopo futuro).

---

## ✨ Funcionalidades
- Mapa Interativo: Visualização completa do campus com pontos de interesse.
- Catálogo de Locais: Busca e detalhes de salas, banheiros, laboratórios, etc.
- UX Intuitiva: Design responsivo e focado na experiência mobile-first.
- Autenticação: Sistema completo de registro, login e gerenciamento de perfil.
- Roteirização: Modelo de dados com relacionamento N-N entre Locais e Rotas.
- Documentação da API: Endpoints documentados com Swagger para fácil consulta.

#### Roadmap (Futuro):
- Navegação em tempo real (indoor navigation).
- Notificações push para eventos e avisos.
- Integrações com sistemas acadêmicos (notas, horários).
- Analytics de fluxo e recursos B2B para a instituição.

---

## 🛠️ Tecnologias e Arquitetura

| Camada        | Tecnologia                      | Propósito                                                 |
| :------------ | :------------------------------ | :-------------------------------------------------------- |
| Frontend      | React, Vite, Tailwind CSS       | Interface reativa, rápida e estilizada (PWA)              |
| Backend       | Node.js, Express 5, TypeScript  | API robusta, segura e tipada                              |
| Segurança     | Helmet, CORS, Rate Limit        | Proteção de headers, controle de acesso e força bruta     |
| Logs          | pino-http                       | Monitoramento e debugging da API                          |
| Banco de Dados| PostgreSQL 16 (via Docker)      | Armazenamento persistente e relacional                    |
| ORM           | Prisma                          | Mapeamento objeto-relacional e migrações                  |
| Documentação  | Swagger                         | Documentação interativa da API                            |

#### Portas Padrão:
- Frontend: http://localhost:5173
- Backend (API): http://localhost:3001
- PostgreSQL (Host → Container): 5433 → 5432

---

## 🚀 Como Rodar (Ambiente de Desenvolvimento)

Pré-requisitos:
- Node.js v18 ou superior
- Docker Desktop em execução

### 1) Clone o Repositório
```bash
git clone https://github.com/JaoVile/Gnomon.git
cd Gnomon
```

### 2) Configure as Variáveis de Ambiente
Navegue até a pasta do backend, copie o arquivo de exemplo .env.example e renomeie-o para .env.

```bash
# Navegue até a pasta correta do backend
cd Gnomon-backend
cp .env.example .env
```

Importante: Abra o arquivo .env e preencha as variáveis, especialmente as de JWT_SECRET e EMAIL. Veja a seção “Variáveis de Ambiente” para mais detalhes.

### 3) Inicie o Banco de Dados com Docker
A partir da raiz do projeto, suba o contêiner do PostgreSQL.

```bash
docker compose up -d
```

Para verificar se o contêiner está rodando e a porta foi mapeada corretamente:

```bash
docker ps
# ou
docker port gnomon-postgres
```

### 4) Rode as Migrações do Banco
Com o banco de dados ativo, aplique o schema do Prisma.

```bash
# Estando na pasta /Gnomon-backend
npx prisma migrate dev
```

### 5) Inicie o Backend
```bash
# Estando na pasta /Gnomon-backend
npm install
npm run dev
```

O servidor estará rodando. Verifique a saúde da API em:
- Healthcheck: http://localhost:3001/health
- Swagger: http://localhost:3001/api/docs

### 6) Inicie o Frontend
Abra um novo terminal, navegue até a pasta do frontend e execute os comandos:

```bash
# Exemplo de nome de pasta, ajuste se necessário
cd ../Gnomon-frontend
npm install
npm run dev
```

Pronto! A aplicação estará acessível em http://localhost:5173.

---

## 🔧 Variáveis de Ambiente
O arquivo .env na pasta Gnomon-backend é crucial para o funcionamento da aplicação.

```env
# Servidor
PORT=3001
API_BASE_URL=http://localhost:3001

# URLs do frontend permitidas pelo CORS (separadas por vírgula)
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173

# URL pública para links (ex: e-mail de recuperação de senha)
FRONTEND_PUBLIC_URL=http://localhost:5173

# Conexão com o banco de dados (PostgreSQL rodando no Docker)
DATABASE_URL="postgresql://gnomon:gnomon@localhost:5433/gnomon?schema=public"
# URL usada diretamente pelo Prisma para migrações
DIRECT_DATABASE_URL="postgresql://gnomon:gnomon@localhost:5433/gnomon?schema=public"

# Autenticação e E-mail
JWT_SECRET="troque_por_um_segredo_muito_forte_e_aleatorio"
# E-mail para envio de notificações (ex: recuperação de senha)
EMAIL_USER="seuemail@gmail.com"
EMAIL_PASS="sua_senha_de_app_do_gmail"
```

---

## 🗃️ Banco de Dados e Prisma
O projeto utiliza PostgreSQL gerenciado pelo Prisma ORM.

Comandos úteis do Prisma:

- Formatar o schema:
```bash
npx prisma format
```

- Executar uma nova migração:
```bash
npx prisma migrate dev --name "nome-da-sua-mudanca"
```

- Gerar o cliente Prisma após mudanças no schema:
```bash
npx prisma generate
```

- Abrir a UI do Prisma Studio:
```bash
npx prisma studio
```

Acesso via pgAdmin (Opcional):
- Host: localhost
- Port: 5433
- Database: gnomon
- User: gnomon
- Password: gnomon

---

## 📖 Swagger (Documentação da API)
A documentação completa da API é gerada automaticamente e pode ser acessada de forma interativa.

- Interface Gráfica (UI): http://localhost:3001/api/docs  
- Arquivo JSON (definição): http://localhost:3001/api/docs.json

A documentação suporta autenticação Bearer JWT. Para testar rotas protegidas, utilize o botão “Authorize” e insira o token obtido no login.

---

## Escopo do Projeto

O que está incluído (MVP):
- PWA funcional com as principais funcionalidades.
- Mapeamento completo e catálogo de locais do campus.
- Exibição de informações detalhadas e rotas estáticas.
- Documentação da API e testes básicos.

O que não está incluído (Futuro):
- Navegação em tempo real (GPS indoor).
- Notificações push.
- Integração com sistemas externos (calendário acadêmico, etc.).
- Modelo de monetização B2B.

---

## Modelo de Negócio (Futuro)
O Gnomon foi projetado para ser licenciado como uma solução B2B para instituições de ensino e outras organizações com grandes espaços físicos, e não como um produto para o usuário final.

Possibilidades de Monetização:
- Assinatura institucional (licenciamento de software).
- Recursos premium (analytics de fluxo, integrações com sistemas legados).

---

## Equipe
- Gestor do Projeto: João Marcos Ferreira Vilela  
- Membros: Lucas Hiago de Paulo Barbosa, David Roberto da Silva Sousa  
- Patrocinador: Professor Antonio Almeida

---

## Licença
Este projeto é licenciado sob a Licença MIT. Veja o arquivo LICENSE para mais detalhes. =/
```

```
Gnomon_Local
├─ Gnomon-backend
│  ├─ .dockerignore
│  ├─ .env
│  ├─ dist
│  │  ├─ config
│  │  │  └─ mail.js
│  │  ├─ controllers
│  │  │  ├─ AuthController.js
│  │  │  └─ LocalController.js
│  │  ├─ index.js
│  │  ├─ middleware
│  │  │  ├─ authMiddleware.js
│  │  │  └─ docs
│  │  │     ├─ openapi.js
│  │  │     ├─ swagger.js
│  │  │     └─ users.docs.js
│  │  ├─ routes
│  │  │  ├─ authRouters.js
│  │  │  └─ localRoutes.js
│  │  └─ server.js
│  ├─ docker-compose.yml
│  ├─ Dockerfile
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ localRoutes.js
│  │  ├─ mapRoutes.js
│  │  ├─ migrations
│  │  │  ├─ 20251117150643_init_admin_table
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  ├─ schema.prisma
│  │  ├─ seed.ts
│  │  └─ swagger.js
│  ├─ src
│  │  ├─ config
│  │  │  └─ mail.ts
│  │  ├─ controllers
│  │  │  ├─ AuthController.ts
│  │  │  └─ LocalController.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ authMiddleware.ts
│  │  │  └─ docs
│  │  │     ├─ locais.docs.ts
│  │  │     ├─ openapi.ts
│  │  │     ├─ swagger.ts
│  │  │     └─ users.docs.ts
│  │  ├─ routes
│  │  │  ├─ authRouters.ts
│  │  │  └─ localRoutes.ts
│  │  └─ server.ts
│  └─ tsconfig.json
├─ Gnomon-react
│  ├─ .env
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ css
│  │  │  │  └─ index-w6UZozRX.css
│  │  │  ├─ img
│  │  │  │  ├─ David-CmwEhJiK.jpg
│  │  │  │  ├─ Gnomon Logo _ SEM NOME-DMDDslfa.png
│  │  │  │  ├─ Joao-BTAKBEAu.jpg
│  │  │  │  └─ Lucas-BdnrgAPR.jpg
│  │  │  ├─ js
│  │  │  │  ├─ index-BM0BkvbT.js
│  │  │  │  ├─ particles-vendor-CddQblDT.js
│  │  │  │  ├─ ParticlesBackground-Cz9Q0VoK.js
│  │  │  │  └─ react-vendor-kRTjhaTT.js
│  │  │  └─ media
│  │  │     └─ Nassau_Intro-D3b6Mo67.mp4
│  │  ├─ Gnomon_Icon.png
│  │  ├─ Gnomon_Sem_Nome_Icon.png
│  │  ├─ index.html
│  │  ├─ maps
│  │  │  ├─ Campus_2D_CIMA.png
│  │  │  ├─ Campus_2D_DETALHE.png
│  │  │  ├─ cima
│  │  │  │  ├─ nodes.json
│  │  │  │  └─ path-graph.json
│  │  │  ├─ detalhe
│  │  │  │  ├─ nodes.json
│  │  │  │  └─ path-graph.json
│  │  │  ├─ generate-edges-cima.js
│  │  │  └─ generate-edges.js
│  │  ├─ models
│  │  │  └─ Campus.glb
│  │  ├─ places
│  │  │  ├─ auditorio.jpg
│  │  │  ├─ banheiro.jpg
│  │  │  ├─ banheiro2.jpg
│  │  │  ├─ biblioteca.jpg
│  │  │  ├─ cantina.png
│  │  │  ├─ cra.jpg
│  │  │  ├─ entrada1.jpg
│  │  │  ├─ entrada2.jpeg
│  │  │  ├─ laboratorios.jpg
│  │  │  ├─ modelo3d.png
│  │  │  ├─ navegacao2d.png
│  │  │  ├─ patio.jpg
│  │  │  ├─ professores.jpeg
│  │  │  ├─ sala.png
│  │  │  └─ secretaria.jpeg
│  │  └─ sundial_pattern.svg
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ Gnomon_Icon.png
│  │  ├─ Gnomon_Sem_Nome_Icon.png
│  │  ├─ maps
│  │  │  ├─ Campus_2D_CIMA.png
│  │  │  ├─ Campus_2D_DETALHE.png
│  │  │  ├─ cima
│  │  │  │  ├─ nodes.json
│  │  │  │  └─ path-graph.json
│  │  │  ├─ detalhe
│  │  │  │  ├─ nodes.json
│  │  │  │  └─ path-graph.json
│  │  │  ├─ generate-edges-cima.js
│  │  │  ├─ generate-edges.js
│  │  │  └─ staff
│  │  │     ├─ nodes.json
│  │  │     └─ path-graph.json
│  │  ├─ models
│  │  │  └─ Campus.glb
│  │  ├─ places
│  │  │  ├─ auditorio.jpg
│  │  │  ├─ banheiro.jpg
│  │  │  ├─ banheiro2.jpg
│  │  │  ├─ biblioteca.jpg
│  │  │  ├─ cantina.png
│  │  │  ├─ cra.jpg
│  │  │  ├─ entrada1.jpg
│  │  │  ├─ entrada2.jpeg
│  │  │  ├─ laboratorios.jpg
│  │  │  ├─ modelo3d.png
│  │  │  ├─ navegacao2d.png
│  │  │  ├─ patio.jpg
│  │  │  ├─ professores.jpeg
│  │  │  ├─ sala.png
│  │  │  └─ secretaria.jpeg
│  │  └─ sundial_pattern.svg
│  ├─ README.md
│  ├─ scripts
│  │  └─ connect-pois.js
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  ├─ David.jpg
│  │  │  ├─ Gnomon Logo _ SEM NOME.png
│  │  │  ├─ Gnomon Logo.png
│  │  │  ├─ GnomonLogo.png
│  │  │  ├─ GnomonLogoSemNome.png
│  │  │  ├─ image.png
│  │  │  ├─ Joao.jpg
│  │  │  ├─ Lucas.jpg
│  │  │  ├─ Mapa.png
│  │  │  └─ Nassau_Intro.mp4
│  │  ├─ components
│  │  │  ├─ BottomSheet
│  │  │  │  ├─ BottomSheet.css
│  │  │  │  └─ BottomSheet.tsx
│  │  │  ├─ ConfigComponents
│  │  │  │  ├─ ConfigComponents.css
│  │  │  │  └─ ConfigComponents.tsx
│  │  │  ├─ CtaButton
│  │  │  │  ├─ CtaButton.css
│  │  │  │  └─ CtaButton.tsx
│  │  │  ├─ Favoritos
│  │  │  │  ├─ FavoritosPopup.css
│  │  │  │  └─ FavoritosPopup.tsx
│  │  │  ├─ Footer
│  │  │  │  ├─ Footer.css
│  │  │  │  └─ Footer.tsx
│  │  │  ├─ GpsMarker
│  │  │  │  ├─ GpsMarker.css
│  │  │  │  └─ GpsMarker.tsx
│  │  │  ├─ Header
│  │  │  │  ├─ Header.css
│  │  │  │  └─ Header.tsx
│  │  │  ├─ Historico
│  │  │  │  ├─ HistoricoPopup.css
│  │  │  │  └─ HistoricoPopup.tsx
│  │  │  ├─ LocationsManager
│  │  │  │  ├─ LocationsManager.css
│  │  │  │  └─ LocationsManager.tsx
│  │  │  ├─ Map2d
│  │  │  │  ├─ Map2D.css
│  │  │  │  └─ Map2D.tsx
│  │  │  ├─ Map3d
│  │  │  │  └─ Campus3d.tsx
│  │  │  ├─ Nodeeditor
│  │  │  │  ├─ NodeEditorPopup.css
│  │  │  │  └─ NodeEditorPopup.tsx
│  │  │  ├─ Particles
│  │  │  │  └─ ParticlesBackground.tsx
│  │  │  ├─ RegistrarFuncionarios
│  │  │  │  ├─ RegisterEmployeePopup.css
│  │  │  │  └─ RegisterEmployeePopup.tsx
│  │  │  ├─ RoutesInstructions
│  │  │  │  ├─ RouteInstructions.css
│  │  │  │  └─ RouteInstructions.tsx
│  │  │  ├─ StagedPoints
│  │  │  │  ├─ StagedPointsPanel.css
│  │  │  │  └─ StagedPointsPanel.tsx
│  │  │  ├─ Theme
│  │  │  │  ├─ ThemeContext.tsx
│  │  │  │  ├─ ThemeSwitcher.css
│  │  │  │  └─ ThemeSwitcher.tsx
│  │  │  └─ Toast
│  │  │     ├─ Toast.css
│  │  │     └─ Toast.tsx
│  │  ├─ contexts
│  │  │  ├─ MapContext.tsx
│  │  │  └─ MapSettingsContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useMapData.ts
│  │  │  ├─ useNavigation2D.ts
│  │  │  ├─ usePathfinding.ts
│  │  │  └─ useScrollAnimation.ts
│  │  ├─ index.css
│  │  ├─ libs
│  │  │  └─ useThemeVars.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ Ajuda
│  │  │  │  ├─ AjudaPage.css
│  │  │  │  └─ AjudaPage.tsx
│  │  │  ├─ Configuracoes
│  │  │  │  ├─ ConfigPage.css
│  │  │  │  └─ ConfigPage.tsx
│  │  │  ├─ EsqueceuSenha
│  │  │  │  ├─ EsqueceuSenhaPage.css
│  │  │  │  └─ EsqueceuSenhaPage.tsx
│  │  │  ├─ Intro
│  │  │  │  ├─ Intro.css
│  │  │  │  └─ Intro.tsx
│  │  │  ├─ Login
│  │  │  │  ├─ LoginPage.css
│  │  │  │  └─ LoginPage.tsx
│  │  │  ├─ Mapa
│  │  │  │  ├─ MapaPage.css
│  │  │  │  └─ MapaPage.tsx
│  │  │  ├─ Perfil
│  │  │  │  ├─ PerfilAdminPage.css
│  │  │  │  ├─ PerfilAdminPage.tsx
│  │  │  │  ├─ PerfilStaffPage.css
│  │  │  │  ├─ PerfilStaffPage.tsx
│  │  │  │  └─ PerfilWrapper.tsx
│  │  │  └─ RedefinirSenha
│  │  │     ├─ RedefinirSenha.css
│  │  │     └─ RedefinirSenha.tsx
│  │  ├─ routes.tsx
│  │  └─ vite-env.d.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
└─ Readme.md

```