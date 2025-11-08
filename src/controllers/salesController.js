// ARQUIVO: src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    searchSales: async (req, res) => {
        try {
            // A API de Vendas espera 'data_inicio' e 'data_fim', que já são enviados pelo front-end.
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim
            };

            // 1. Busca os dados com o endpoint correto.
            // A API de Vendas usa 'itens' (em português).
            const result = await contaAzul.get('/v1/venda/busca', { params: apiParams });

            // 2. Salva o resultado.
            await jsonManager.save('vendas', result);

            // 3. Retorna a lista de itens e o total para o front-end.
            // A API de Vendas retorna 'total_itens'.
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });

        } catch (err) {
            console.error('Erro ao buscar Vendas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
};