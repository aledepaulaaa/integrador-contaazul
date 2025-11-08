// ARQUIVO: src/controllers/productsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listProducts: async (req, res) => {
        try {
            // Mapeia os parâmetros do front-end para os nomes corretos da API
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100
            };

            // Adiciona os filtros de data apenas se eles existirem
            if (req.query.data_inicio) apiParams.ultima_atualizacao_de = req.query.data_inicio;
            if (req.query.data_fim) apiParams.ultima_atualizacao_ate = req.query.data_fim;

            const result = await contaAzul.get('/v1/produto/busca', { params: apiParams });
            await jsonManager.save('produtos', result);

            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });
        } catch (err) {
            console.error('Erro ao buscar Produtos:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};