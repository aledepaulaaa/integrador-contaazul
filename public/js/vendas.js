// ARQUIVO: /public/js/vendas.js
const vendasHandler = {
    format: function (rawData) {
        // Guardamos os dados brutos para usar no modal
        window.rawApiData = window.rawApiData || {};
        rawData.forEach(venda => window.rawApiData[venda.id] = venda);

        const formattedData = rawData.map(venda => {
            const clienteDetails = { Nome: venda.cliente?.nome, Email: venda.cliente?.email };
            return {
                'Data': formatDateTime(venda.data),
                'Tipo': venda.tipo === 'SALE' ? 'Venda' : venda.tipo,
                'Total': (venda.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Cliente': createAccordion(venda.id, venda.cliente?.nome || 'N/A', clienteDetails),
                'Situação': venda.situacao?.descricao || 'N/A',
                'Ações': `
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info btn-print" data-id="${venda.id}" data-type="condicional" data-entity="vendas">Condicional</button>
                        <button class="btn btn-sm btn-outline-warning btn-print" data-id="${venda.id}" data-type="promissoria" data-entity="vendas">Promissória</button>
                    </div>
                `
            };
        });

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header,
            orderable: header !== 'Ações', // Desabilita ordenação na coluna Ações
            searchable: header !== 'Ações' // Desabilita busca na coluna Ações
        }));

        return { formattedData, columnsConfig };
    }
};