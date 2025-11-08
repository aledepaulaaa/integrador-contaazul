// ARQUIVO: /public/js/main.js (O novo orquestrador)

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Objeto global para armazenar os "handlers" (módulos de formatação) de cada entidade.
    // Os outros arquivos (vendas.js, pessoas.js, etc.) irão popular este objeto.
    window.appHandlers = {};

    // Armazena a instância do DataTables para poder ser gerenciada
    let dataTableInstance = null;
    // Armazena os dados formatados da última busca para uso nas funções de exportação
    window.currentExportData = [];

    // --- FUNÇÃO CENTRAL DE INICIALIZAÇÃO DA TABELA ---

    /**
     * Inicializa ou atualiza a tabela com a biblioteca DataTables.
     * @param {Array<Object>} data - Os dados formatados a serem exibidos.
     * @param {Array<Object>} columnsConfig - A configuração de colunas para o DataTables.
     */
    function initializeDataTable(data, columnsConfig) {
        const tableElement = $('#interactive-table');
        const entityName = $('#filter-entity').selectedOptions[0].text;

        if (!data || data.length === 0) {
            $('#data-container').style.display = 'none';
            $('#output').innerHTML = `<p class="text-center p-3">Nenhum dado de "${entityName}" encontrado para os filtros selecionados.</p>`;
            return;
        }

        // Destrói a instância anterior da tabela para evitar conflitos ao recarregar
        if (dataTableInstance) {
            dataTableInstance.destroy();
        }
        tableElement.innerHTML = ''; // Limpa qualquer conteúdo HTML residual

        // Inicializa o DataTables
        dataTableInstance = new DataTable(tableElement, {
            data: data,
            columns: columnsConfig,
            responsive: true,
            destroy: true,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json',
            },
            // Garante que o HTML dentro das células (como Accordions e botões) seja renderizado
            columnDefs: [{
                targets: '_all',
                render: function (data, type, row) {
                    if (type === 'display') {
                        return data;
                    }
                    // Para ordenação e busca, extrai o texto puro do HTML para evitar problemas
                    const tempDiv = document.createElement('div');
                    if (typeof data === 'string') {
                        tempDiv.innerHTML = data;
                    }
                    return tempDiv.textContent || tempDiv.innerText || '';
                }
            }]
        });
    }

    // --- LÓGICA DE BUSCA E ROTEAMENTO ---

    /**
     * Função principal que busca os dados no back-end e os renderiza.
     */
    async function fetchAndRender() {
        let entityValue = $('#filter-entity').value;
        const startDate = $('#filter-startDate').value;
        const endDate = $('#filter-endDate').value;
        const financeId = $('#finance-id-filter').value.trim();
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');

        let apiPath = '';
        const params = new URLSearchParams();

        // Determina a rota e os parâmetros com base na seleção do usuário
        if (entityValue === 'financeiro') {
            entityValue = $('#finance-subtype').value;
            if (financeId) {
                const endpointMap = { baixas: 'baixa', cobrancas: 'cobranca' };
                apiPath = `/api/${endpointMap[entityValue]}/${financeId}`;
            } else {
                apiPath = `/api/${entityValue}`;
                if (startDate) params.append('data_inicio', startDate);
                if (endDate) params.append('data_fim', endDate);
            }
        } else {
            apiPath = `/api/${entityValue}`;
            if (startDate) params.append('data_inicio', startDate);
            if (endDate) params.append('data_fim', endDate);
        }

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const fullUrl = `${apiPath}?${params.toString()}`;
            const res = await fetch(fullUrl, { method: entityValue === 'pessoas' ? 'POST' : 'GET' }); // Usa POST para pessoas
            const json = await res.json();

            if (json.ok) {
                // CORREÇÃO: Define o handler antes de usá-lo
                const handler = window.appHandlers[entityValue];
                if (!handler || typeof handler.format !== 'function') {
                    throw new Error(`Handler para "${entityValue}" não encontrado ou inválido.`);
                }

                const { formattedData, columnsConfig } = handler.format(json.data || []);
                window.currentExportData = formattedData;

                initializeDataTable(formattedData, columnsConfig);

                dataContainer.style.display = 'block';
                outputDiv.innerHTML = '';
            } else {
                // Tenta pegar a mensagem de erro de dentro do objeto
                const errorMessage = (typeof json.error === 'object') ? JSON.stringify(json.error) : json.error;
                throw new Error(errorMessage || 'Erro ao buscar dados do servidor.');
            }
        } catch (error) {
            // Exibe o erro "Unexpected token '<'" como uma mensagem mais amigável
            if (error.message.includes('Unexpected token')) {
                outputDiv.innerHTML = `<pre class="text-danger">Ocorreu um erro inesperado no servidor. Verifique os logs do back-end.</pre>`;
            } else {
                outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
            }
            dataContainer.style.display = 'none';
        }
    }

    // --- EVENT LISTENERS ---
    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');
    $('#btn-filtrar').addEventListener('click', fetchAndRender);

    // Mostra/esconde o sub-seletor de Financeiro
    $('#filter-entity').addEventListener('change', (e) => {
        const isFinance = e.target.value === 'financeiro';
        $('#finance-wrapper').style.display = isFinance ? 'block' : 'none';
        // Esconde os filtros de data se não for relevante para a busca por ID
        $('#filter-startDate').disabled = isFinance && $('#finance-id-filter').value.trim();
        $('#filter-endDate').disabled = isFinance && $('#finance-id-filter').value.trim();
    });

    $('#btn-mostrar-historico').addEventListener('click', async () => {
        const res = await fetch('/api/historico');
        const json = await res.json();
        $('#data-container').style.display = 'none';
        $('#output').innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>';
    });

    // NOVO LISTENER PARA O CAMPO DE ID
    $('#finance-id-filter').addEventListener('keyup', (e) => {
        const hasId = e.target.value.trim() !== '';
        $('#filter-startDate').disabled = hasId;
        $('#filter-endDate').disabled = hasId;
    });

    // --- FUNÇÕES E LISTENERS DE EXPORTAÇÃO ---

    function getExportData() {
        // Usa a variável global com os dados já formatados
        return window.currentExportData.map(row => {
            const cleanRow = { ...row };
            // Limpa o HTML dos accordions/botões para ter um texto limpo na exportação
            for (const key in cleanRow) {
                if (typeof cleanRow[key] === 'string' && cleanRow[key].includes('<')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cleanRow[key];
                    cleanRow[key] = (tempDiv.querySelector('button')?.textContent || tempDiv.textContent || '').trim();
                }
            }
            return cleanRow;
        });
    }

    $('#btn-export-pdf').addEventListener('click', () => {
        if (!window.currentExportData || window.currentExportData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = Object.keys(exportData[0]);
        const body = exportData.map(row => headers.map(header => row[header]));
        doc.autoTable({ head: [headers], body: body, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 36] } });
        doc.save(`relatorio_${$('#filter-entity').value}.pdf`);
    });

    $('#btn-export-excel').addEventListener('click', () => {
        if (!window.currentExportData || window.currentExportData.length === 0) return alert('Não há dados para exportar.');
        const exportData = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
        XLSX.writeFile(workbook, `relatorio_${$('#filter-entity').value}.xlsx`);
    });
});