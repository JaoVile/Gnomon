"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const node_path_1 = __importDefault(require("node:path"));
const helmet_1 = __importDefault(require("helmet"));
const swaggerUi = __importStar(require("swagger-ui-express")); // compat sem esModuleInterop
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
function setupSwagger(app) {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const options = {
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
            node_path_1.default.join(process.cwd(), 'src', 'server.ts'),
            node_path_1.default.join(process.cwd(), 'src', 'routes', '**', '*.ts'),
            node_path_1.default.join(process.cwd(), 'src', 'controllers', '**', '*.ts'),
            node_path_1.default.join(process.cwd(), 'src', 'docs', '**', '*.ts'),
            node_path_1.default.join(process.cwd(), 'src', 'docs', '**', '*.yaml'),
            node_path_1.default.join(process.cwd(), 'src', 'docs', '**', '*.yml'),
            // Build (produção)
            node_path_1.default.join(process.cwd(), 'dist', 'server.js'),
            node_path_1.default.join(process.cwd(), 'dist', 'routes', '**', '*.js'),
            node_path_1.default.join(process.cwd(), 'dist', 'controllers', '**', '*.js'),
            node_path_1.default.join(process.cwd(), 'dist', 'docs', '**', '*.js'),
        ],
    };
    const specs = (0, swagger_jsdoc_1.default)(options);
    // JSON para depuração
    app.get('/api/docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
    // CSP mais permissiva só na UI do Swagger (por causa do Helmet)
    const cspDefaults = helmet_1.default.contentSecurityPolicy.getDefaultDirectives();
    app.use('/api/docs', helmet_1.default.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            ...cspDefaults,
            'script-src': ["'self'", "'unsafe-inline'", 'https:'],
            'style-src': ["'self'", "'unsafe-inline'", 'https:'],
            'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        },
    }), swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
    console.log(`📚 Swagger docs: ${baseUrl}/api/docs`);
}
