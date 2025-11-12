// ARQUIVO: /src/controllers/salesController.js
const contaAzul = require('../utils/contaAzulAPI');
const jsonManager = require('../models/jsonManager');

module.exports = {
    searchSales: async (req, res) => {
        try {
            // Podemos verificar se o usuário adicionou filtro ou não, basta descomentar o bloco da verificação abaixo
            
            // if (!req.query.data_inicio || !req.query.data_fim) {
            //     return res.status(400).json({ ok: false, error: 'Por favor, selecione um período de data de início e fim para buscar as vendas.' });
            // }

            const apiParams = {
                pagina: req.query.pagina || 1,
                tamanho_pagina: 100,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim
            };

            const result = await contaAzul.get('/venda/busca', { params: apiParams });
            await jsonManager.save('vendas', result);
            return res.json({ ok: true, data: result.itens, totalItems: result.total_itens });

        } catch (err) {
            console.error('Erro ao buscar Vendas:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: err.message });
        }
    },
     // NOVA FUNÇÃO: Busca a venda mais recente de um cliente específico
    getLatestSaleByClientId: async (req, res) => {
        try {
            const { clienteId } = req.params;
            if (!clienteId) {
                return res.status(400).json({ ok: false, error: 'O ID do cliente é obrigatório.' });
            }

            // Parâmetros para a API da Conta Azul:
            // - Filtra pelo ID do cliente
            // - Ordena pela data em ordem decrescente para pegar a mais recente
            // - Limita o resultado a apenas 1
            const apiParams = {
                cliente_id: clienteId,
                campo_ordenado_descendente: 'data',
                tamanho_pagina: 1
            };

            const result = await contaAzul.get('/venda/busca', { params: apiParams });

            // Verifica se alguma venda foi encontrada
            if (!result || !result.itens || result.itens.length === 0) {
                return res.status(404).json({ ok: false, error: 'Nenhuma venda encontrada para este cliente.' });
            }

            // Retorna a primeira (e única) venda encontrada
            return res.json({ ok: true, data: result.itens[0] });

        } catch (err) {
            console.error('Erro ao buscar venda por cliente:', err.response?.data || err.message);
            return res.status(err.response?.status || 500).json({ ok: false, error: 'Falha ao buscar venda do cliente.' });
        }
    }
};