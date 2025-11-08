// ARQUIVO: /src/controllers/productsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listProducts: async (req, res) => {
        try {
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
            };

            const result = await contaAzul.get('/produtos', { params: apiParams });
            await jsonManager.save('produtos', result);
            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });

        } catch (err) {
            console.error('Erro ao buscar Produtos:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};