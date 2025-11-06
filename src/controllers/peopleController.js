// ARQUIVO: src/controllers/peopleController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listPeople: async (req, res) => {
        try {
            // Mapeia os parâmetros do front-end para os nomes esperados pela API de Pessoas
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_criacao_de: req.query.data_inicio,
                data_criacao_ate: req.query.data_fim
            };

            // 1. Primeiro, busca os dados da API com o endpoint e parâmetros corretos.
            // A API de Pessoas usa 'items' (no plural em inglês).
            const result = await contaAzul.get('/pessoa/busca', { params: apiParams });

            // 2. Depois, salva o resultado completo.
            await jsonManager.save('pessoas', result);

            // 3. Retorna a lista de itens e o total para o front-end.
            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });

        } catch (err) {
            console.error('Erro ao buscar Pessoas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};