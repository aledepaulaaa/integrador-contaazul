// src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');
const { buildDateFilters } = require('../utils/dateUtils');

module.exports = {
    searchSales: async (req, res) => {
        try {
            const filters = buildDateFilters(req.query);
            const params = { pagina: 1, tamanho_pagina: 20, ...filters, ...req.query };

            const result = await contaAzul.get('/venda/busca', { params });

            await jsonManager.save('vendas', result);

            return res.json({ ok: true, data: result.itens });

        } catch (err) {
            console.error('Erro ao buscar vendas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
};