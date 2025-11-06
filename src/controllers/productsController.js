// ARQUIVO: src/controllers/productsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listProducts: async (req, res) => {
        try {
            // Mapeia os parâmetros do front-end para os nomes esperados pela API de Produtos
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                ultima_atualizacao_de: req.query.data_inicio,
                ultima_atualizacao_ate: req.query.data_fim
            };

            // 1. Busca os dados com o endpoint correto.
            // A API de Produtos também usa 'items'.
            const result = await contaAzul.get('/produto/busca', { params: apiParams });

            // 2. Salva o resultado.
            await jsonManager.save('produtos', result);

            // 3. Retorna a lista de itens e o total.
            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });

        } catch (err) {
            console.error('Erro ao buscar Produtos:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};