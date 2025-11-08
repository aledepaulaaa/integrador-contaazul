// ARQUIVO: /src/controllers/financialsController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    getChargeById: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ ok: false, error: 'ID da Cobrança é obrigatório.' });

            // Endpoint correto para buscar uma única cobrança por ID
            const result = await contaAzul.get(`/financeiro/eventos-financeiros/contas-a-receber/cobranca/${id}`);
            await jsonManager.save('cobrancas', result);
            return res.json({ ok: true, data: [result], totalItems: 1 });
        } catch (err) {
            console.error('Erro ao buscar Cobrança por ID:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    getAcquittanceById: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ ok: false, error: 'ID da Baixa é obrigatório.' });

            // Endpoint correto para buscar uma única baixa por ID
            const result = await contaAzul.get(`/financeiro/eventos-financeiros/baixas/${id}`);
            await jsonManager.save('baixas', result);
            return res.json({ ok: true, data: [result], totalItems: 1 });
        } catch (err) {
            console.error('Erro ao buscar Baixa por ID:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    listCostCenters: async (req, res) => {
        try {
            const statusFilter = req.query.status; // Pega o status do frontend

            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                busca: req.query.busca
            };

            // Adiciona o filtro_rapido APENAS se ele foi enviado e o converte para MAIÚSCULAS
            if (statusFilter) {
                apiParams.filtro_rapido = statusFilter.toUpperCase();
            }

            const result = await contaAzul.get('/centro-de-custo', { params: apiParams });
            console.log("Resultado do Centro de Custos: ", result);

            await jsonManager.save('centro_de_custos', result);

            return res.json({ ok: true, data: result.itens, totalItems: result.itens_totais });

        } catch (err) {
            console.error('Erro ao buscar Centros de Custo:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};