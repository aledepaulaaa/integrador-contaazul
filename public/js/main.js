// ARQUIVO: /public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Armazena os dados formatados da última busca para uso na exportação
    let formattedData = [];

    // --- FUNÇÕES DE FORMATAÇÃO E TRANSFORMAÇÃO DE DADOS ---

    /**
     * Formata data/hora do formato ISO para o padrão brasileiro.
     * @param {string} isoString - A data no formato ISO (ex: "2025-11-04T11:05:39.608").
     * @param {boolean} includeTime - Se deve incluir a hora na formatação.
     * @returns {string} - A data formatada (ex: "04/11/2025" ou "04/11/2025 - 11:05:39").
     */
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

    /**
     * Transforma os dados brutos de vendas da API em um formato amigável para exibição.
     * @param {Array<Object>} rawData - O array de vendas retornado pela API.
     * @returns {Array<Object>} - Um novo array com os dados formatados e traduzidos.
     */
    function formatSalesData(rawData) {
        if (!rawData) return [];

        const tipoMap = { 'SALE': 'Venda', 'SERVICE': 'Serviço' }; // Mapeamento para tradução
        const pagoMap = { false: 'Não', true: 'Sim' };

        return rawData.map(venda => {
            // Cria o HTML do accordion para os detalhes do cliente
            const clienteHtml = `
                <div class="accordion accordion-flush" id="accordion-${venda.id}">
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${venda.id}">
                                ${venda.cliente?.nome || 'N/A'}
                            </button>
                        </h2>
                        <div id="collapse-${venda.id}" class="accordion-collapse collapse" data-bs-parent="#accordion-${venda.id}">
                            <div class="accordion-body">
                                <strong>Email:</strong> ${venda.cliente?.email || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return {
                'Data': formatDateTime(venda.data),
                'Criado em': formatDateTime(venda.criado_em, true),
                'Alterado em': formatDateTime(venda.data_alteracao, true),
                'Tipo': tipoMap[venda.tipo] || venda.tipo,
                'Item': venda.itens === 'PRODUCT' ? 'Produto' : venda.itens,
                'Pago': pagoMap[venda.condicao_pagamento],
                'Total': venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                'Cliente': clienteHtml,
                'Situação': venda.situacao?.descricao || 'N/A'
            };
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function renderTable(data) {
        const container = $('#table-responsive-container');
        const entityName = $('#filter-entity').selectedOptions[0].text;

        if (!data || data.length === 0) {
            container.innerHTML = `<p class="text-center p-3">Nenhum dado de "${entityName}" encontrado para os filtros selecionados.</p>`;
            return;
        }

        const headers = Object.keys(data[0]);
        const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;

        const bodyHtml = `<tbody>${data.map(row =>
            `<tr>${headers.map(header => `<td>${row[header]}</td>`).join('')}</tr>`
        ).join('')}</tbody>`;

        container.innerHTML = `<table class="table table-dark table-hover data-table">${headerHtml}${bodyHtml}</table>`;
    }

    function filterTable(searchText) {
        const table = $('.data-table');
        if (!table) return;
        const lowerCaseSearchText = searchText.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(row => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(lowerCaseSearchText) ? '' : 'none';
        });
    }

    // --- EVENT LISTENERS ---

    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');

    $('#btn-filtrar').addEventListener('click', async () => {
        const entity = $('#filter-entity').value;
        const startDate = $('#filter-startDate').value;
        const endDate = $('#filter-endDate').value;
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('data_inicio', startDate);
            if (endDate) params.append('data_fim', endDate);

            const res = await fetch(`/api/${entity}?${params.toString()}`);
            const json = await res.json();

            if (json.ok) {
                // A MÁGICA ACONTECE AQUI: Formata os dados antes de usar
                if (entity === 'vendas') {
                    formattedData = formatSalesData(json.data);
                } else {
                    // Adicione formatadores para outras entidades aqui se necessário
                    formattedData = json.data;
                }

                renderTable(formattedData);
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

    $('#table-filter').addEventListener('keyup', (e) => filterTable(e.target.value));

    // --- FUNÇÕES DE EXPORTAÇÃO APRIMORADAS ---

    function getExportData() {
        // Para exportação, removemos colunas com HTML (como o Accordion)
        // e pegamos o texto puro.
        return formattedData.map(row => {
            const cleanRow = { ...row };
            // Extrai o nome do cliente do HTML do accordion
            const match = cleanRow['Cliente'].match(/<button.*?>(.*?)<\/button>/);
            cleanRow['Cliente'] = match ? match[1].trim() : 'N/A';
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

        doc.autoTable({
            head: [headers],
            body: body,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 36] }
        });
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