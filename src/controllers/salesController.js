// src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    searchSales: async (req, res) => {
        try {
            // Parâmetros padrão para paginação
            const defaultParams = {
                pagina: 1,
                tamanho_pagina: 20 // Define um padrão de 20 itens por página
            };

            // Mescla os padrões com os filtros do usuário (filtros do usuário sobrescrevem os padrões)
            const params = { ...defaultParams, ...req.query };

            // A rota está correta!
            const result = await contaAzul.get('/venda/busca', { params });
            console.log("Chamando API vendas: ", result);

            const saved = await jsonManager.save('vendas', result);
            return res.json({ ok: true, saved });
        } catch (err) {
            console.error('Erro detalhado ao buscar vendas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
}