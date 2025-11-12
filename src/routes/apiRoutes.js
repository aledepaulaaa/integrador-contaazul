// ARQUIVO: /src/routes/apiRoutes.js (FINAL E CORRIGIDO)
const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesController');
const peopleController = require('../controllers/peopleController');
const productsController = require('../controllers/productsController');
const invoicesController = require('../controllers/invoicesController');
const historyController = require('../controllers/historyController');
const financialsController = require('../controllers/financialsController');

// --- ROTAS DE LISTAGEM / BUSCA ---
router.get('/vendas', salesController.searchSales);
router.get('/vendas/cliente/:clienteId', salesController.getLatestSaleByClientId)

router.get('/pessoas', peopleController.listPeople); // Corrigido para GET
router.get('/produtos', productsController.listProducts);
router.get('/notas', invoicesController.listInvoices);

// --- ROTAS FINANCEIRAS ---
router.get('/centro_de_custos', financialsController.listCostCenters);
router.get('/cobrancas/:id', financialsController.getChargeById); // Mudança de nome para refletir a ação
router.get('/baixas/:id', financialsController.getAcquittanceById); // Mudança de nome para refletir a ação

// --- ROTAS DE HISTÓRICO ---
router.get('/historico', historyController.getHistory);
router.get('/historico/:type/:filename', historyController.getHistoryFile);
router.delete('/historico/:type/:filename', historyController.deleteHistoryFile);

module.exports = router;