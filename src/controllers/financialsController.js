// ARQUIVO: /src/controllers/financialsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    /**
     * Busca a lista de Baixas (liquidações financeiras).
     */
    listAcquittances: async (req, res) => {
        try {
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_pagamento_inicio: req.query.data_inicio,
                data_pagamento_fim: req.query.data_fim
            };
            // O endpoint para Baixas é /baixas
            const result = await contaAzul.get('/baixas', { params: apiParams });
            await jsonManager.save('baixas', result);
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });
        } catch (err) {
            console.error('Erro ao buscar Baixas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    /**
     * Busca a lista de Cobranças (Contas a Receber).
     */
    listCharges: async (req, res) => {
        try {
            // A API de Contas a Receber usa 'due_date_start' e 'due_date_end'
            const apiParams = {
                page: req.query.pagina || 1,
                size: 100,
                due_date_start: req.query.data_inicio,
                due_date_end: req.query.data_fim
            };
            // O endpoint para Cobranças (Contas a Receber) é /receivables
            const result = await contaAzul.get('/receivables', { params: apiParams });
            await jsonManager.save('cobrancas', result);
            return res.json({ ok: true, data: result }); // A resposta deste endpoint já é o array de dados
        } catch (err) {
            console.error('Erro ao buscar Cobranças:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};