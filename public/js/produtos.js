// ARQUIVO: /public/js/produtos.js
const produtosHandler = {
    format: function (rawData) {
        const formattedData = rawData.map(produto => ({
            'Código': produto.codigo,
            'Nome': produto.nome,
            'Valor Venda': (produto.valor_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Saldo': produto.saldo,
            'Status': produto.status === 'ATIVO' ? 'Ativo' : 'Inativo',
            'Atualizado em': formatDateTime(produto.ultima_atualizacao, true)
        }));

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};