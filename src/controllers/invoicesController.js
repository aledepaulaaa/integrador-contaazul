// ARQUIVO: /src/controllers/invoicesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listInvoices: async (req, res) => {
        try {
            if (!req.query.data_inicio || !req.query.data_fim) {
                return res.status(400).json({ ok: false, error: 'Campos de data obrigatórios não informados.' });
            }

            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_inicial: req.query.data_inicio,
                data_final: req.query.data_fim
            };

            const result = await contaAzul.get('/notas-fiscais', { params: apiParams });
            await jsonManager.save('notas_fiscais', result);
            return res.json({ 
                ok: true, 
                data: result.itens || [], // Garantir que 'data' seja um array
                totalItems: result.paginacao?.total_itens || 0 // Acessa 'total_itens' de forma segura
            });

        } catch (err) {
            console.error('Erro ao buscar Notas Fiscais:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};