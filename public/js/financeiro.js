// ARQUIVO: /public/js/financeiro.js

// Baixas
const financeirosHandlers = {
    baixas: {
        format: function (rawData) {
            const formattedData = rawData.map(baixa => {
                const composicao = baixa.valor_composicao || {};
                return {
                    'Data Pag.': formatDateTime(baixa.data_pagamento),
                    'Valor Bruto': (composicao.valor_bruto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    'Juros/Multa': ((composicao.juros || 0) + (composicao.multa || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    'Método': baixa.metodo_pagamento,
                    'Tipo': baixa.tipo_evento_financeiro,
                    'Detalhes': `<button class="btn btn-sm btn-outline-light" data-bs-toggle="modal" data-bs-target="#details-modal" data-details='${JSON.stringify(baixa)}'>Ver Tudo</button>`
                };
            });

            const columnsConfig = Object.keys(formattedData[0]).map(header => ({ data: header, title: header }));

            // Lógica do Modal (adicionada apenas uma vez)
            if (!document.body.hasAttribute('data-modal-listener')) {
                document.body.setAttribute('data-modal-listener', 'true');
                document.body.addEventListener('click', function (event) {
                    if (event.target.matches('[data-bs-toggle="modal"]')) {
                        const details = JSON.parse(event.target.dataset.details);
                        document.getElementById('details-modal-title').textContent = `Detalhes Completos`;
                        const body = document.getElementById('details-modal-body');
                        body.innerHTML = `<pre>${JSON.stringify(details, null, 2)}</pre>`;
                    }
                });
            }

            return { formattedData, columnsConfig };
        }
    },

    // Cobranças
    cobrancas: {
        format: function (rawData) {
            const formattedData = rawData.map(cobranca => ({
                'Vencimento': formatDateTime(cobranca.due_date),
                'Valor': (cobranca.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Status': cobranca.status,
                'Cliente': cobranca.customer.name,
                'ID da Venda': cobranca.sale_id,
            }));

            const columnsConfig = Object.keys(formattedData[0]).map(header => ({ data: header, title: header }));
            return { formattedData, columnsConfig };
        }
    },

    // Centro de Custos
    centro_de_custos: {
        format: function (rawData) {
            const formattedData = rawData.map(centro => ({
                'Código': centro.codigo || 'N/A', // Adicionado fallback
                'Nome': centro.nome || 'N/A', // Adicionado fallback
                'Ativo': centro.ativo === true ? 'Sim' : 'Não' // Acesso direto, pois é boolean.
            }));

            const columnsConfig = Object.keys(formattedData[0]).map(header => ({ data: header, title: header }));
            return { formattedData, columnsConfig };
        }
    }
}