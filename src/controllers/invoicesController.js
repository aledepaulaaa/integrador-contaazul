// ARQUIVO: src/controllers/invoicesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listInvoices: async (req, res) => {
        try {
            // Mapeia os parâmetros do front-end para os nomes corretos da API
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100
            };

            // Adiciona os filtros de data apenas se eles existirem
            if (req.query.data_inicio) apiParams.data_emissao_inicio = req.query.data_inicio;
            if (req.query.data_fim) apiParams.data_emissao_fim = req.query.data_fim;

            // Garante que pelo menos um dos campos de data obrigatórios seja enviado
            if (!apiParams.data_emissao_inicio && !apiParams.data_emissao_fim) {
                // Se nenhum for enviado, podemos definir um padrão, por exemplo, o último mês
                const today = new Date();
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                apiParams.data_emissao_inicio = lastMonth.toISOString().split('T')[0];
                apiParams.data_emissao_fim = today.toISOString().split('T')[0];
            }

            const result = await contaAzul.get('/v1/notas-fiscais', { params: apiParams });
            await jsonManager.save('notas_fiscais', result);

            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });
        } catch (err) {
            console.error('Erro ao buscar Notas Fiscais:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};