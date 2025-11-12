// ARQUIVO: /public/js/main.js

// Armazena a instância do Modal de Impressão para ser gerenciada
let printModalInstance = null;
// Armazena os dados brutos da API (resposta original) para uso em modais e impressões
window.rawApiData = {};

document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Objeto global para armazenar os "handlers" (módulos de formatação)
    window.appHandlers = {};
    // Armazena a instância do DataTables para ser gerenciada
    let dataTableInstance = null;
    // Armazena os dados já formatados para uso nas funções de exportação
    window.currentExportData = [];

    // --- INICIALIZAÇÃO CENTRALIZADA DOS MÓDULOS ---
    window.appHandlers = {
        vendas: vendasHandler,
        pessoas: pessoasHandler,
        produtos: produtosHandler,
        notas: notasFiscaisHandler,
        baixas: financeirosHandlers.baixas,
        cobrancas: financeirosHandlers.cobrancas,
        centro_de_custos: financeirosHandlers.centro_de_custos
    };

    // --- FUNÇÕES DE UI (CONTROLE DE VISIBILIDADE DOS FILTROS) ---
    function updateVisibleFilters() {
        const entity = $('#filter-entity').value;
        const financeSubtype = $('#finance-subtype').value;
        document.querySelectorAll('#dynamic-filters-container .filter-control').forEach(el => el.style.display = 'none');
        if (entity === 'financeiro') {
            $('#finance-subtype-wrapper').style.display = 'flex';
            if (financeSubtype === 'centro_de_custos') {
                $('#cost-center-status-wrapper').style.display = 'flex';
                $('#cost-center-search-wrapper').style.display = 'flex';
            } else {
                $('#finance-id-wrapper').style.display = 'flex';
            }
        } else if (entity === 'vendas' || entity === 'notas') {
            $('#date-filters').style.display = 'flex';
            $('#date-filters-end').style.display = 'flex';
        }
    }

    // --- LÓGICA DE BUSCA DE DADOS ---
    async function fetchAndRender() {
        let entityValue = $('#filter-entity').value;
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');
        let apiPath = '';
        const params = new URLSearchParams();

        if (entityValue === 'financeiro') {
            entityValue = $('#finance-subtype').value;
            const financeId = $('#finance-id-filter').value.trim();
            if (entityValue === 'centro_de_custos') {
                apiPath = `/api/centro_de_custos`;
                params.append('busca', $('#cost-center-search').value);
                params.append('status', $('#cost-center-status').value);
            } else {
                if (!financeId) return alert('Por favor, insira um ID para a busca.');
                const endpoint = (entityValue === 'baixas') ? 'baixa' : 'cobranca';
                apiPath = `/api/${endpoint}/${financeId}`;
            }
        } else {
            apiPath = `/api/${entityValue}`;
            if (entityValue === 'vendas' || entityValue === 'notas') {
                params.append('data_inicio', $('#filter-startDate').value);
                params.append('data_fim', $('#filter-endDate').value);
            }
        }

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        try {
            const fullUrl = `${apiPath}?${params.toString()}`;
            const res = await fetch(fullUrl, { method: 'GET' });
            const json = await res.json();

            if (json.ok) {
                window.rawApiData = {}; // Limpa os dados brutos antigos
                const handler = window.appHandlers[entityValue];
                if (!handler) throw new Error(`Handler para "${entityValue}" não implementado.`);
                const { formattedData, columnsConfig } = handler.format(json.data || []);
                window.currentExportData = formattedData;
                initializeDataTable(formattedData, columnsConfig);
                dataContainer.style.display = 'block';
                outputDiv.innerHTML = '';
            } else {
                throw new Error(json.error || `O servidor retornou um erro (Status: ${res.status})`);
            }
        } catch (error) {
            outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
        }
    }

    // --- FUNÇÃO CENTRAL DE INICIALIZAÇÃO DA TABELA (DATATABLES) ---
    function initializeDataTable(data, columnsConfig) {
        const tableElement = $('#interactive-table');
        const entityName = $('#filter-entity').selectedOptions[0].text;
        if (!data || data.length === 0) {
            $('#data-container').style.display = 'none';
            $('#output').innerHTML = `<p class="text-center p-3">Nenhum dado de "${entityName}" encontrado.</p>`;
            return;
        }
        if (dataTableInstance) dataTableInstance.destroy();
        tableElement.innerHTML = '';
        dataTableInstance = new DataTable(tableElement, {
            data: data,
            columns: columnsConfig,
            responsive: true,
            destroy: true,
            language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json' },
            columnDefs: [{
                targets: '_all',
                render: (data, type) => (type === 'display') ? data : new DOMParser().parseFromString(data, 'text/html').body.textContent || ''
            }]
        });
    }

    // --- LÓGICA DE IMPRESSÃO ---
    function showPrintModal(data, type) {
        const modalTitle = $('#print-modal-title');
        const modalBody = $('#print-modal-body');
        const confirmPrintBtn = $('#btn-confirm-print');
        let htmlContent = '';
        if (type === 'condicional') {
            modalTitle.textContent = 'Impressão de Venda Condicional';
            htmlContent = PrintHandler.generateCondicionalHTML(data);
        } else {
            modalTitle.textContent = 'Impressão de Nota Promissória';
            htmlContent = PrintHandler.generatePromissoriaHTML(data);
        }
        modalBody.innerHTML = htmlContent;
        confirmPrintBtn.onclick = () => handlePrinting(modalBody.innerHTML);
        printModalInstance.show();
    }

    function handlePrinting(content) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Imprimir Documento</title><style>body{font-family:monospace;margin:0;}.print-preview{margin:0;white-space:pre-wrap;}@media print{body{-webkit-print-color-adjust:exact;}}</style></head><body>${content}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    // --- EVENT LISTENERS ---
    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');
    $('#btn-buscar-dados').addEventListener('click', fetchAndRender);
    $('#filter-entity').addEventListener('change', updateVisibleFilters);
    $('#finance-subtype').addEventListener('change', updateVisibleFilters);

    $('#btn-mostrar-historico').addEventListener('click', async () => {
        const historyModal = new bootstrap.Modal($('#history-modal'));
        const modalBody = $('#history-modal-body');
        modalBody.innerHTML = '<p class="text-center">Carregando histórico...</p>';
        historyModal.show();
        try {
            const res = await fetch('/api/historico');
            const json = await res.json();
            if (!json.ok || !json.list) throw new Error('Não foi possível carregar o histórico.');
            let historyHtml = '';
            for (const [category, files] of Object.entries(json.list)) {
                if (category === 'auth' || files.length === 0) continue;
                const fileItems = files.map(file => `
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white">
                        <a href="#" class="text-white btn-view-history" data-type="${category}" data-filename="${file}">${file}</a>
                        <button class="btn btn-sm btn-outline-danger btn-delete-history" data-type="${category}" data-filename="${file}.json">Excluir</button>
                    </li>`).join('');
                historyHtml += `
                    <div class="accordion-item">
                        <h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${category}">${category.charAt(0).toUpperCase() + category.slice(1)} (${files.length})</button></h2>
                        <div id="collapse-${category}" class="accordion-collapse collapse"><div class="accordion-body p-0"><ul class="list-group list-group-flush">${fileItems}</ul></div></div>
                    </div>`;
            }
            modalBody.innerHTML = `<div class="accordion accordion-flush">${historyHtml || '<p class="text-center">Nenhum arquivo no histórico.</p>'}</div>`;
        } catch (error) {
            modalBody.innerHTML = `<p class="text-danger text-center">${error.message}</p>`;
        }
    });

    // --- DELEGAÇÃO DE EVENTOS GERAL ---
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        // Botão para visualizar dados do histórico
        if (target.classList.contains('btn-view-history')) {
            e.preventDefault();
            const { type, filename } = target.dataset;
            const historyModal = bootstrap.Modal.getInstance($('#history-modal'));
            try {
                const res = await fetch(`/api/historico/${type}/${filename}`);
                const json = await res.json();
                if (!json.ok) throw new Error(json.error || 'Não foi possível carregar os dados.');
                historyModal.hide();
                const handler = window.appHandlers[type];
                if (!handler) throw new Error(`Handler para "${type}" não implementado.`);
                const dataToFormat = (json.data && json.data.itens) ? json.data.itens : json.data;
                const { formattedData, columnsConfig } = handler.format(dataToFormat);
                window.currentExportData = formattedData;
                initializeDataTable(formattedData, columnsConfig);
                $('#data-container').style.display = 'block';
                $('#output').innerHTML = `<div class="alert alert-info">Exibindo dados do histórico: ${filename}</div>`;
            } catch (error) {
                alert(error.message);
            }
        }
        // Botão para deletar arquivo do histórico
        if (target.classList.contains('btn-delete-history')) {
            const { type, filename } = target.dataset;
            if (confirm(`Tem certeza que deseja excluir o arquivo ${filename} da categoria ${type}?`)) {
                try {
                    const res = await fetch(`/api/historico/${type}/${filename}`, { method: 'DELETE' });
                    const json = await res.json();
                    if (json.ok) target.closest('li').remove();
                    else throw new Error(json.error || 'Erro ao excluir arquivo.');
                } catch (error) {
                    alert(error.message);
                }
            }
        }
        // Botão de impressão na tabela
        if (target.classList.contains('btn-print')) {
            const { id, type, entity } = target.dataset;

            // Se for uma venda, os dados já estão prontos
            if (entity === 'vendas') {
                const dataToPrint = window.rawApiData[id];
                if (!dataToPrint) return alert('Erro: Dados da venda não encontrados.');
                showPrintModal(dataToPrint, type);
            }
            // Se for uma pessoa, busca a venda mais recente antes de imprimir
            else if (entity === 'pessoas') {
                target.disabled = true;
                target.textContent = 'Buscando...';
                try {
                    const res = await fetch(`/api/vendas/cliente/${id}`);
                    const json = await res.json();
                    if (!json.ok) throw new Error(json.error);
                    // Agora temos os dados da venda e podemos usar a mesma função
                    showPrintModal(json.data, type);
                } catch (error) {
                    alert(`Erro ao buscar venda: ${error.message}`);
                } finally {
                    target.disabled = false;
                    target.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                }
            }
        }
    });

    // --- FUNÇÕES E LISTENERS DE EXPORTAÇÃO ---
    function getExportData() {
        return window.currentExportData.map(row => {
            const cleanRow = { ...row };
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

    // --- INICIALIZAÇÃO ---
    printModalInstance = new bootstrap.Modal($('#print-modal'));
    updateVisibleFilters();
});