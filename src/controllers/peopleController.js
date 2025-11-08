// ARQUIVO: /src/controllers/peopleController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    listPeople: async (req, res) => {
        try {
            // Este endpoint usa POST e não necessita de datas, mas pode receber outros filtros.
            const requestBody = {
                pagina: 1,
                tamanho_pagina: 100,
            };

            const result = await contaAzul.post('/pessoa/busca', requestBody);
            await jsonManager.save('pessoas', result);
            return res.json({ ok: true, data: result.items, totalItems: result.totalItems });

        } catch (err) {
            console.error('Erro ao buscar Pessoas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    }
};