"use strict";
/**
 * @file localRoutes.ts
 * @description Este arquivo define as rotas da API para o recurso 'Local',
 * como buscar todos os locais, buscar um por ID e criar um novo local.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importa as funções de lógica do controller correspondente.
const LocalController_1 = require("../controllers/LocalController");
// Cria uma nova instância de roteador do Express.
const router = (0, express_1.Router)();
// --- DEFINIÇÃO DAS ROTAS PARA /api/locais ---
/**
 * @route   GET /api/locais
 * @desc    Rota para listar todos os locais cadastrados.
 * @access  Público
 */
router.get('/', LocalController_1.getAllLocais);
/**
 * @route   GET /api/locais/:id
 * @desc    Rota para buscar um local específico pelo seu ID.
 * @access  Público
 */
router.get('/:id', LocalController_1.getLocalById);
/**
 * @route   POST /api/locais
 * @desc    Rota para criar um novo local.
 * @access  Privado (futuramente, apenas para administradores)
 */
router.post('/', LocalController_1.createLocal);
/*
 * ROTAS FUTURAS PARA ATUALIZAR E DELETAR (CRUD Completo)
 *
 * router.put('/:id', updateLocal);    // Rota para atualizar um local existente.
 * router.delete('/:id', deleteLocal); // Rota para deletar um local.
 */
// Exporta o roteador para ser usado no arquivo server.ts.
exports.default = router;
