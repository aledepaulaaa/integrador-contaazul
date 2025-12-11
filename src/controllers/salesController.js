// ARQUIVO: /src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    searchSales: async (req, res) => {
        try {
            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim
            };

            // Rota de busca (listagem)
            const result = await contaAzul.get('/venda/busca', { params: apiParams });
            await jsonManager.save('vendas', result);
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });

        } catch (err) {
            console.error('Erro ao buscar Vendas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },

    getLatestSaleByClientId: async (req, res) => {
        try {
            const { clienteId } = req.params;
            if (!clienteId) return res.status(400).json({ ok: false, error: 'ID obrigatório.' });

            const apiParams = {
                cliente_id: clienteId,
                campo_ordenado_descendente: 'data',
                tamanho_pagina: 1
            };

            const result = await contaAzul.get('/venda/busca', { params: apiParams });

            if (!result || !result.itens || result.itens.length === 0) {
                return res.status(404).json({ ok: false, error: 'Nenhuma venda encontrada.' });
            }
            return res.json({ ok: true, data: result.itens[0] });

        } catch (err) {
            return res.status(500).json({ ok: false, error: 'Erro ao buscar venda.' });
        }
    },

    // --- CORREÇÃO IMPORTANTE AQUI ---
    getById: async (req, res) => {
        try {
            const { id } = req.params;

            // A API V1 da Conta Azul para detalhes geralmente responde em /v1/sales/{id}
            // Se sua base URL já tem /v1, usamos apenas /sales/${id}
            // Verifique se o seu 'contaAzulAPI' já tem o base URL configurado.
            const response = await contaAzul.get(`/sales/${id}`);

            return res.json({ ok: true, data: response.data });
        } catch (error) {
            console.error('Erro ao buscar venda detalhada:', error.response?.data || error.message);
            return res.status(500).json({ ok: false, error: 'Falha ao buscar detalhes da venda.' });
        }
    }
};