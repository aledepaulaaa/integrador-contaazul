// ARQUIVO: /public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Armazena os dados formatados para uso nas funções de exportação
    let formattedData = [];
    // Armazena a instância do DataTables para poder destruí-la e recriá-la
    let dataTableInstance = null;

    // --- FUNÇÕES DE FORMATAÇÃO E TRANSFORMAÇÃO DE DADOS ---
    // (Estas funções permanecem as mesmas, pois são essenciais para traduzir os dados da API)

    function formatDateTime(isoString, includeTime = false) {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        let formatted = date.toLocaleDateString('pt-BR', options);
        if (includeTime) {
            formatted += ` - ${date.toLocaleTimeString('pt-BR')}`;
        }
        return formatted;
    }

    function createAccordion(id, buttonText, details) {
        if (!buttonText || buttonText === 'undefined, undefined') buttonText = 'Ver Detalhes';
        const detailsHtml = Object.entries(details)
            .map(([key, value]) => `<strong>${key}:</strong> ${value || 'N/A'}<br>`)
            .join('');

        return `
            <div class="accordion accordion-flush" id="accordion-${id}">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}">
                            ${buttonText}
                        </button>
                    </h2>
                    <div id="collapse-${id}" class="accordion-collapse collapse" data-bs-parent="#accordion-${id}">
                        <div class="accordion-body">${detailsHtml}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function formatSalesData(rawData) {
        return rawData.map(venda => ({
            'Data': formatDateTime(venda.data),
            'Criado em': formatDateTime(venda.criado_em, true),
            'Alterado em': formatDateTime(venda.data_alteracao, true),
            'Tipo': venda.tipo === 'SALE' ? 'Venda' : venda.tipo,
            'Item': venda.itens === 'PRODUCT' ? 'Produto' : venda.itens,
            'Pago': venda.condicao_pagamento ? 'Sim' : 'Não',
            'Total': (venda.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Cliente': createAccordion(venda.id, venda.cliente?.nome || 'N/A', { Nome: venda.cliente?.nome, Email: venda.cliente?.email }),
            'Situação': venda.situacao?.descricao || 'N/A'
        }));
    }

    function formatPeopleData(rawData) {
        return rawData.map(pessoa => ({
            'Nome': pessoa.nome,
            'Email': pessoa.email,
            'Telefone': pessoa.telefone,
            'Tipo': pessoa.tipo_pessoa === 'FISICA' ? 'Física' : 'Jurídica',
            'Perfis': pessoa.perfis ? pessoa.perfis.join(', ') : 'N/A',
            'Endereço': createAccordion(pessoa.id, `${pessoa.endereco?.logradouro}, ${pessoa.endereco?.numero}`, { Logradouro: `${pessoa.endereco?.logradouro}, ${pessoa.endereco?.numero}`, Bairro: pessoa.endereco?.bairro, Cidade: `${pessoa.endereco?.cidade} - ${pessoa.endereco?.estado}`, CEP: pessoa.endereco?.cep }),
            'Ativo': pessoa.ativo ? 'Sim' : 'Não'
        }));
    }

    function formatProductsData(rawData) {
        return rawData.map(produto => ({
            'Código': produto.codigo,
            'Nome': produto.nome,
            'Valor de Venda': (produto.valor_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Custo Médio': (produto.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Saldo': produto.saldo,
            'Status': produto.status === 'ATIVO' ? 'Ativo' : 'Inativo',
            'Variações': produto.produtos_variacao ? `${produto.produtos_variacao.length} variações` : 'Nenhuma',
            'Atualizado em': formatDateTime(produto.ultima_atualizacao, true)
        }));
    }

    // --- NOVA FUNÇÃO CENTRAL COM DATATABLES ---

    /**
     * Inicializa ou atualiza a tabela com a biblioteca DataTables.
     * @param {Array<Object>} data - Os dados formatados a serem exibidos.
     */
    function initializeDataTable(data) {
        const tableElement = $('#interactive-table');
        const entityName = $('#filter-entity').selectedOptions[0].text;

        if (!data || data.length === 0) {
            $('#data-container').style.display = 'none';
            $('#output').innerHTML = `<p class="text-center p-3">Nenhum dado de "${entityName}" encontrado para os filtros selecionados.</p>`;
            return;
        }

        const columns = Object.keys(data[0]).map(header => ({
            data: header,
            title: header
        }));

        // Destrói a instância anterior da tabela para evitar conflitos
        if (dataTableInstance) {
            dataTableInstance.destroy();
            tableElement.innerHTML = ''; // Limpa a tabela
        }

        // Inicializa o DataTables com as configurações
        dataTableInstance = new DataTable(tableElement, {
            data: data,
            columns: columns,
            responsive: true,
            destroy: true,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json',
            },
            // Garante que o HTML dentro das células (como o Accordion) seja renderizado
            columnDefs: [{
                targets: '_all',
                render: function (data, type, row) {
                    if (type === 'display') {
                        return data;
                    }
                    // Para ordenação e busca, extrai o texto puro do HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data;
                    return tempDiv.textContent || tempDiv.innerText || '';
                }
            }]
        });
    }

    // --- EVENT LISTENERS (Atualizados) ---

    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');

    $('#btn-filtrar').addEventListener('click', async () => {
        const entityValue = $('#filter-entity').value;
        const startDate = $('#filter-startDate').value;
        const endDate = $('#filter-endDate').value;
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const params = new URLSearchParams();
            // A busca no back-end não precisa de paginação; o DataTables cuida disso no front-end
            if (startDate) params.append('data_inicio', startDate);
            if (endDate) params.append('data_fim', endDate);

            const res = await fetch(`/api/${entityValue}?${params.toString()}`);
            const json = await res.json();

            if (json.ok) {
                let rawData = json.data || [];
                // Roteador de formatação
                switch (entityValue) {
                    case 'vendas': formattedData = formatSalesData(rawData); break;
                    case 'pessoas': formattedData = formatPeopleData(rawData); break;
                    case 'produtos': formattedData = formatProductsData(rawData); break;
                    default: formattedData = rawData;
                }

                initializeDataTable(formattedData);

                dataContainer.style.display = 'block';
                outputDiv.innerHTML = '';
            } else {
                throw new Error(json.error || 'Erro ao buscar dados.');
            }
        } catch (error) {
            outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
            dataContainer.style.display = 'none';
        }
    });

    $('#btn-mostrar-historico').addEventListener('click', async () => {
        const res = await fetch('/api/historico');
        const json = await res.json();
        $('#data-container').style.display = 'none';
        $('#output').innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
    });

    // --- FUNÇÕES DE EXPORTAÇÃO (Permanecem as mesmas) ---

    function getExportData() {
        return formattedData.map(row => {
            const cleanRow = { ...row };
            for (const key in cleanRow) {
                if (typeof cleanRow[key] === 'string' && cleanRow[key].includes('accordion')) {
                    const match = cleanRow[key].match(/<button.*?>(.*?)<\/button>/);
                    cleanRow[key] = match ? match[1].trim() : 'N/A';
                }
            }
            return cleanRow;
        });
    }

    $('#btn-export-pdf').addEventListener('click', () => {
        if (formattedData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = Object.keys(exportData[0]);
        const body = exportData.map(row => headers.map(header => row[header]));
        doc.autoTable({ head: [headers], body: body, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 36] } });
        doc.save(`relatorio_${$('#filter-entity').value}.pdf`);
    });

    $('#btn-export-excel').addEventListener('click', () => {
        if (formattedData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
        XLSX.writeFile(workbook, `relatorio_${$('#filter-entity').value}.xlsx`);
    });
});