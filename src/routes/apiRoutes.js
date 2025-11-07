// ARQUIVO: /src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

// Importação de todos os controllers
const salesController = require('../controllers/salesController');
const peopleController = require('../controllers/peopleController');
const productsController = require('../controllers/productsController');
const invoicesController = require('../controllers/invoicesController');
const historyController = require('../controllers/historyController');
const financialsController = require('../controllers/financialsController');

// --- ROTAS DE LISTAGEM ---
router.get('/vendas', salesController.searchSales);
router.post('/pessoas', peopleController.listPeople);
router.get('/produtos', productsController.listProducts);
router.get('/notas', invoicesController.listInvoices);

// --- ROTAS FINANCEIRAS (LISTAGEM) ---
router.get('/baixas', financialsController.listAcquittances);
router.get('/cobrancas', financialsController.listCharges);
router.get('/centro_de_custos', financialsController.listCostCenters);

// --- ROTAS FINANCEIRAS (BUSCA POR ID) ---
router.get('/cobranca/:id', financialsController.getChargeById);
router.get('/baixa/:id', financialsController.getAcquittanceByInstallmentId);

// --- ROTAS DE HISTÓRICO ---
router.get('/historico', historyController.getHistory);
// CORREÇÃO APLICADA AQUI: Usando a variável correta "historyController"
router.delete('/historico/:type/:filename', historyController.deleteHistoryFile);

module.exports = router;