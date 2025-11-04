//src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

const salesController = require('../controllers/salesController');
const peopleController = require('../controllers/peopleController');
const productsController = require('../controllers/productsController');
const invoicesController = require('../controllers/invoicesController');
const chargesController = require('../controllers/chargesController');
const historyController = require('../controllers/historyController');

// Vendas
router.get('/vendas', salesController.searchSales);
// Pessoas
router.get('/pessoas', peopleController.listPeople);
// Produtos
router.get('/produtos', productsController.listProducts);
// Notas fiscais
router.get('/notas', invoicesController.listInvoices);
// Cobranças
router.get('/cobrancas', chargesController.listCharges);

// Histórico
router.get('/historico', historyController.list);
router.get('/historico/:type/:id', historyController.getById);
router.delete('/historico/:type/:id', historyController.remove);

module.exports = router;
