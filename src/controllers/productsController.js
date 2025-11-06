//src/controllers/productsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');
const { buildDateFilters } = require('../utils/dateUtils');

module.exports = {
    listProducts: async (req, res) => {
        try {
            const filters = buildDateFilters(req.query);
            const defaultParams = { pagina: 1, tamanho_pagina: 20 };
            const params = { ...defaultParams, ...req.query, ...filters };
            const result = await contaAzul.get('/produtos', { params });
            const saved = await jsonManager.save('produtos', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error(err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};
