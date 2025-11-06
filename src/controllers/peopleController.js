//src/controllers/peopleController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');
const { buildDateFilters } = require('../utils/dateUtils');

module.exports = {
    listPeople: async (req, res) => {
        try {
            const filters = buildDateFilters(req.query);
            const defaultParams = { pagina: 1, tamanho_pagina: 20 };

            const params = { ...defaultParams, ...req.query, ...filters };

            await jsonManager.save('pessoas', result);

            const result = await contaAzul.get('/pessoas', { params });
            
            return res.json({ ok: true, data: result.itens });
        } catch (err) {
            console.error(err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};
