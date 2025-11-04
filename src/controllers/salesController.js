//src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

// Funções exemplares que consultam a API e salvam o resultado localmente.
module.exports = {
    searchSales: async (req, res) => {
        try {
            const params = req.query;
            // Exemplo de endpoint - pode precisar ajustar à doc oficial
            const result = await contaAzul.get('/sales', { params });

            // salva o resultado localmente
            const saved = await jsonManager.save('vendas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    searchPeople: async (req, res) => {
        try {
            const params = req.query;
            const result = await contaAzul.get('/contacts', { params });
            const saved = await jsonManager.save('pessoas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    searchProducts: async (req, res) => {
        try {
            const params = req.query;
            const result = await contaAzul.get('/products', { params });
            const saved = await jsonManager.save('produtos', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    searchInvoices: async (req, res) => {
        try {
            const params = req.query;
            const result = await contaAzul.get('/invoices', { params });
            const saved = await jsonManager.save('notas_fiscais', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    searchCharges: async (req, res) => {
        try {
            const params = req.query;
            const result = await contaAzul.get('/charges', { params });
            const saved = await jsonManager.save('cobrancas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
}