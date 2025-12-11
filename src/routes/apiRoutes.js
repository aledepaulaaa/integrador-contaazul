// ARQUIVO: /src/routes/apiRoutes.js
const express = require('express')
const router = express.Router()

const salesController = require('../controllers/salesController')
const peopleController = require('../controllers/peopleController')
const productsController = require('../controllers/productsController')
const invoicesController = require('../controllers/invoicesController')
const historyController = require('../controllers/historyController')
const financialsController = require('../controllers/financialsController')
const settingsController = require('../controllers/settingsController')

// --- ROTAS DE LISTAGEM / BUSCA ---
router.get('/vendas', salesController.searchSales)
router.get('/vendas/cliente/:clienteId', salesController.getLatestSaleByClientId)
router.get('/vendas/:id', salesController.getById)

router.get('/pessoas', peopleController.listPeople)
router.get('/produtos', productsController.listProducts)
router.get('/notas', invoicesController.listInvoices)

// --- ROTAS FINANCEIRAS ---
router.get('/centro_de_custos', financialsController.listCostCenters)
router.get('/cobrancas/:id', financialsController.getChargeById)
router.get('/baixas/:id', financialsController.getAcquittanceById)

// --- ROTAS DE HISTÓRICO ---
router.get('/historico', historyController.getHistory)
router.get('/historico/:type/:filename', historyController.getHistoryFile)
router.delete('/historico/:type/:filename', historyController.deleteHistoryFile)

// Rotas de Configuração de Impressão
router.get('/settings/print', settingsController.getPrintSettings)
router.post('/settings/print', settingsController.savePrintSettings)
router.delete('/settings/print', settingsController.deletePrintSettings)

module.exports = router