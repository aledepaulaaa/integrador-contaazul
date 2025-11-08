// ARQUIVO: /src/routes/apiRoutes.js
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
router.post('/pessoas', peopleController.listPeople); // Corrigido para POST
router.get('/produtos', productsController.listProducts);
router.get('/notas', invoicesController.listInvoices);
router.get('/centro_de_custos', financialsController.listCostCenters);

// --- ROTAS FINANCEIRAS (BUSCA POR ID) ---
// Note que as rotas de listagem foram removidas e substituídas por estas
router.get('/cobrancas/:id', financialsController.getChargeById);
router.get('/baixas/:id', financialsController.getAcquittanceById);

// --- ROTAS DE HISTÓRICO ---
router.get('/historico', historyController.getHistory);
router.delete('/historico/:type/:filename', historyController.deleteHistoryFile);

module.exports = router;