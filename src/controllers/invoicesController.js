// ARQUIVO: src/controllers/invoicesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listInvoices: async (req, res) => {
        try {
            // "Traduz" os nomes dos parâmetros do front-end para os esperados pela API de Notas Fiscais
            const apiParams = {
                pagina: 1,
                tamanho_pagina: 100, // Aumentado o limite padrão
                data_emissao_inicio: req.query.data_inicio,
                data_emissao_fim: req.query.data_fim
            };

            const result = await contaAzul.get('/notas-fiscais', { params: apiParams });
            await jsonManager.save('notas_fiscais', result);

            // Retorna a lista de itens e o total para a paginação
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });
        } catch (err) {
            console.error('Erro ao buscar Notas Fiscais:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};