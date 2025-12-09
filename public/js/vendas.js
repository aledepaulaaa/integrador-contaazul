// ARQUIVO: /public/js/vendas.js
const vendasHandler = {
    format: function (rawData) {
        window.rawApiData = window.rawApiData || {};
        rawData.forEach(venda => window.rawApiData[venda.id] = venda);

        const formattedData = rawData.map(venda => {
            const clienteDetails = { Nome: venda.cliente?.nome, Email: venda.cliente?.email };

            // Criando botões de ação para imprimir
            const actionsHtml = `
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-info btn-print-row" 
                            data-id="${venda.id}" 
                            data-entity="vendas" 
                            data-type="condicional" 
                            title="Imprimir Condicional">
                        <i class="bi bi-file-text"></i> Cond.
                    </button>
                    <button class="btn btn-sm btn-outline-warning btn-print-row" 
                            data-id="${venda.id}" 
                            data-entity="vendas" 
                            data-type="promissoria" 
                            title="Imprimir Promissória">
                        <i class="bi bi-cash-coin"></i> Prom.
                    </button>
                </div>
            `;

            return {
                'Data': formatDateTime(venda.data),
                'Tipo': venda.tipo === 'SALE' ? 'Venda' : venda.tipo,
                'Total': (venda.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Cliente': createAccordion(venda.id, venda.cliente?.nome || 'N/A', clienteDetails),
                'Situação': venda.situacao?.nome || 'N/A',
                'Ações': actionsHtml
            };
        });

        const columnsConfig = Object.keys(formattedData[0]).map(header => ({
            data: header,
            title: header,
            orderable: header !== 'Ações',
            searchable: header !== 'Ações'
        }));

        return { formattedData, columnsConfig };
    }
};