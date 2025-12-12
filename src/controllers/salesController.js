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
            console.log(`[Backend] Buscando venda ID: ${id}`);

            // 1. Busca os dados principais da venda
            const vendaResponse = await contaAzul.get(`/venda/${id}`);
            let vendaData = vendaResponse.data || vendaResponse;

            // 2. Busca os ITENS da venda (Chamada Extra Obrigatória)
            // Tenta endpoint de itens em português e inglês para garantir
            let itensData = [];
            try {
                // Tenta buscar itens detalhados
                const itensResponse = await contaAzul.get(`/venda/${id}/itens`);
                itensData = itensResponse.data || itensResponse;

                // Se vier aninhado (ex: { itens: [...] })
                if (!Array.isArray(itensData) && itensData.itens) itensData = itensData.itens;

            } catch (errItem) {
                console.warn('[Backend] Aviso: Não foi possível buscar itens separados:', errItem.message);
            }

            // 3. Mescla os dados para o Frontend
            // Se a vendaData já tiver itens (vazio), substituímos pelo que buscamos agora
            const resultadoFinal = {
                ...vendaData,
                // Garante que 'itens' seja o array que buscamos
                itens: (Array.isArray(itensData) && itensData.length > 0) ? itensData : (vendaData.itens || [])
            };

            // Ajuste para facilitar o frontend (aplana a estrutura se vier aninhada em 'venda')
            if (resultadoFinal.venda && !resultadoFinal.numero) {
                // Se os dados principais estiverem dentro de 'venda', subimos eles
                resultadoFinal.numero = resultadoFinal.venda.numero;
                resultadoFinal.data = resultadoFinal.venda.data_compromisso || resultadoFinal.venda.data;
                resultadoFinal.total = resultadoFinal.venda.composicao_valor?.valor_liquido || 0;

                // Parcelas costumam estar dentro de venda.condicao_pagamento
                if (resultadoFinal.venda.condicao_pagamento?.parcelas) {
                    resultadoFinal.parcelas = resultadoFinal.venda.condicao_pagamento.parcelas;
                }
            }

            console.log(`[Backend] Retornando venda ${resultadoFinal.numero} com ${resultadoFinal.itens?.length || 0} itens.`);
            console.log(resultadoFinal);

            return res.json({ ok: true, data: resultadoFinal });

        } catch (error) {
            console.error('[Backend] Erro:', error.response?.data || error.message);
            return res.status(500).json({ ok: false, error: 'Falha ao buscar detalhes.' });
        }
    }
};