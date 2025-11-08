// ARQUIVO: /public/js/vendas.js
const vendasHandler = {
    format: function(rawData) {
        const formattedData = rawData.map(venda => {
            const clienteDetails = { Nome: venda.cliente?.nome, Email: venda.cliente?.email };
            return {
                'Data': formatDateTime(venda.data),
                'Tipo': venda.tipo === 'SALE' ? 'Venda' : venda.tipo,
                'Total': (venda.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Cliente': createAccordion(venda.id, venda.cliente?.nome || 'N/A', clienteDetails),
                'Situação': venda.situacao?.descricao || 'N/A'
            };
        });
        
        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header
        }));

        return { formattedData, columnsConfig };
    }
};