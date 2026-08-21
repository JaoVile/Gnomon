"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
// IMPORTANTE: Ajuste de caminhos para Windows e Linux
// __dirname aqui é: .../Gnomon-backend/src/middleware/docs/
const routesPath = path_1.default.join(__dirname, '../../routes/*.{ts,js}');
const serverPath = path_1.default.join(__dirname, '../../server.{ts,js}');
const controllersPath = path_1.default.join(__dirname, '../../controllers/*.{ts,js}');
// Debug: Mostra no terminal onde ele está procurando
console.log('🔍 Swagger buscando rotas em:', routesPath.replace(/\\/g, '/'));
const options = {
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
        routesPath.replace(/\\/g, '/'), // Pega src/routes
        serverPath.replace(/\\/g, '/'), // Pega src/server.ts
        controllersPath.replace(/\\/g, '/') // Pega controllers
    ],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    // Endpoint JSON (se quiser ver os dados brutos)
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    // Swagger UI
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    // CORREÇÃO DO ERRO DE TYPE:
    // Usamos (swaggerSpec as any) para dizer ao TS que sabemos que 'paths' existe
    const paths = swaggerSpec.paths || {};
    const rotasEncontradas = Object.keys(paths).length;
    console.log(`📚 Swagger UI: http://localhost:${process.env.PORT || 3001}/api/docs`);
    console.log(`✅ Rotas documentadas encontradas: ${rotasEncontradas}`);
};
exports.setupSwagger = setupSwagger;
