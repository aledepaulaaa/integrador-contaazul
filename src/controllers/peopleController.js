// ARQUIVO: src/controllers/peopleController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listPeople: async (req, res) => {
        try {
            // Este endpoint espera um corpo (body) na requisição POST
            const requestBody = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_criacao_de: req.query.data_inicio,
                data_criacao_ate: req.query.data_fim
            };

            // MUDANÇA CRÍTICA: Usando contaAzul.post() e enviando os parâmetros no corpo
            const result = await contaAzul.post('/v1/pessoa/busca', requestBody);

            await jsonManager.save('pessoas', result);
            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });

        } catch (err) {
            console.error('Erro ao buscar Pessoas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};