// ARQUIVO: /src/controllers/financialsController.js (VERSÃO FINAL E CORRETA)
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    // --- FUNÇÕES DE LISTAGEM (PARA A TABELA) ---

    listAcquittances: async (req, res) => {
        try {
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_pagamento_inicio: req.query.data_inicio,
                data_pagamento_fim: req.query.data_fim
            };
            // Endpoint de LISTAGEM que aceita filtros de data
            const result = await contaAzul.get('/baixas', { params: apiParams });
            await jsonManager.save('baixas', result);
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });
        } catch (err) {
            console.error('Erro ao buscar Baixas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    listCharges: async (req, res) => {
        try {
            const apiParams = {
                page: req.query.pagina || 1,
                size: 100,
                due_date_start: req.query.data_inicio,
                due_date_end: req.query.data_fim
            };
            // Endpoint de LISTAGEM de Contas a Receber
            const result = await contaAzul.get('/receivables', { params: apiParams });
            await jsonManager.save('cobrancas', result);
            return res.json({ ok: true, data: result, totalItems: result.length });
        } catch (err) {
            console.error('Erro ao buscar Cobranças:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    listCostCenters: async (req, res) => {
        try {
            const apiParams = { pagina: req.query.pagina || 1, tamanho_pagina: 100 };
            const result = await contaAzul.get('/centro-de-custo', { params: apiParams });
            await jsonManager.save('centro_de_custos', result);
            return res.json({ ok: true, data: result.items, totalItems: result.itens_totais });
        } catch (err) {
            console.error('Erro ao buscar Centros de Custo:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    // --- NOVAS FUNÇÕES DE BUSCA POR ID (PARA A NOVA FUNCIONALIDADE) ---
    getChargeById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await contaAzul.get(`/financeiro/eventos-financeiros/contas-a-receber/cobranca/${id}`);
            // Retorna um único item em um array para manter a consistência com a tabela
            return res.json({ ok: true, data: [result], totalItems: 1 });
        } catch (err) {
            console.error('Erro ao buscar Cobrança por ID:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    getAcquittanceByInstallmentId: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await contaAzul.get(`/financeiro/eventos-financeiros/parcelas/${id}/baixa`);
             // Retorna um único item em um array para manter a consistência com a tabela
            return res.json({ ok: true, data: [result], totalItems: 1 });
        } catch (err) {
            console.error('Erro ao buscar Baixa por ID da Parcela:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};