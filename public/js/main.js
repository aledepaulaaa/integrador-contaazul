// ARQUIVO: /public/js/main.js

let printModalInstance = null;
let editModalInstance = null; // Instância para o modal de edição
window.rawApiData = {}; // Armazena os dados brutos da API para uso nos modais

document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);
    let dataTableInstance = null;
    window.currentExportData = [];

    window.appHandlers = {
        vendas: vendasHandler,
        pessoas: pessoasHandler,
        produtos: produtosHandler,
        notas: notasFiscaisHandler,
        baixas: financeirosHandlers.baixas,
        cobrancas: financeirosHandlers.cobrancas,
        centro_de_custos: financeirosHandlers.centro_de_custos
    };

    // --- FUNÇÕES DE UI (LÓGICA ESTÁVEL E COMPLETA) ---
    function updateVisibleFilters() {
        const entity = $('#filter-entity')?.value;
        const financeSubtype = $('#finance-subtype')?.value;
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
            const res = await fetch(`${apiPath}?${params.toString()}`);
            const json = await res.json();
            if (json.ok) {
                window.rawApiData = {};
                const handler = window.appHandlers[entityValue];
                if (!handler) throw new Error(`Handler para "${entityValue}" não implementado.`);
                const { formattedData, columnsConfig } = handler.format(json.data || []);
                window.currentExportData = formattedData;
                initializeDataTable(formattedData, columnsConfig);
                dataContainer.style.display = 'block';
                outputDiv.innerHTML = '';
            } else {
                throw new Error(json.error || `Erro do servidor (Status: ${res.status})`);
            }
        } catch (error) {
            outputDiv.innerHTML = `<pre class="text-danger">${error.message}</pre>`;
        }
    }

    function initializeDataTable(data, columnsConfig) {
        if (dataTableInstance) dataTableInstance.destroy();
        const tableElement = $('#interactive-table');
        tableElement.innerHTML = '';
        if (!data || data.length === 0) {
            $('#data-container').style.display = 'none';
            $('#output').innerHTML = `<p class="text-center p-3">Nenhum dado encontrado.</p>`;
            return;
        }
        dataTableInstance = new DataTable(tableElement, {
            data, columns: columnsConfig, responsive: true, destroy: true,
            language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json' }
        });
    }

    // --- LÓGICA DE EDIÇÃO E IMPRESSÃO ---
    function showPrintModal(data, type, edits = {}) {
        let htmlContent = '';
        if (type === 'condicional') {
            $('#print-modal-title').textContent = 'Impressão de Venda Condicional';
            htmlContent = PrintHandler.generateCondicionalHTML(data, edits);
        } else {
            $('#print-modal-title').textContent = 'Impressão de Nota Promissória';
            htmlContent = PrintHandler.generatePromissoriaHTML(data, edits);
        }
        $('#print-modal-body').innerHTML = htmlContent;
        $('#btn-confirm-print').onclick = () => handlePrinting(htmlContent);
        printModalInstance.show();
    }

    function showEditModal(data, type) {
        const isCondicional = type === 'condicional';
        $('#edit-modal-title').textContent = `Editar ${isCondicional ? 'Condicional' : 'Promissória'}`;
        $('#edit-header').value = isCondicional ? 'METTA CONTABILIDADE/STA BARBARA DO LESTE' : `METTA CONTABILIDADE\nCNPJ 20316861000190 IE ISENTO\nAV GERALDO MAGELA, 96, CENTRO\nSTA BARBARA DO LESTE/MG`;
        $('#edit-footer').value = isCondicional ? `Reconheço que as mercadorias acima descritas\nestão sob minha responsabilidade e se não forem\ndevolvidas dentro do prazo estipulado,\nesta nota condicional será convertida em venda.` : `Reconheço (emos) a exatidão desta duplicata de\nvenda mercantil/prestacao de serviços, na\nimportância acima que pagarei à METTA\nCONTABILIDADE, ou a sua ordem na praça e\nvencimentos indicados.`;
        $('#condicional-fields').style.display = isCondicional ? 'block' : 'none';
        $('#edit-prazo').value = '';
        $('#edit-modalidade').value = '';
        $('#edit-vencimento').value = data.data.split('T')[0];
        $('#btn-save-and-print').onclick = () => {
            const edits = {
                header: $('#edit-header').value,
                footer: $('#edit-footer').value,
                prazo: $('#edit-prazo').value,
                modalidade: $('#edit-modalidade').value,
                vencimento: $('#edit-vencimento').value
            };
            editModalInstance.hide();
            showPrintModal(data, type, edits);
        };
        editModalInstance.show();
    }

    function handlePrinting(content) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Imprimir</title><style>body{font-family:monospace;margin:0;}.print-preview{margin:0;white-space:pre-wrap;}@media print{body{-webkit-print-color-adjust:exact;}}</style></head><body>${content}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }

    // --- EVENT LISTENERS (COM VERIFICAÇÃO DE EXISTÊNCIA) ---
    const btnAuth = $('#btn-auth');
    if (btnAuth) btnAuth.addEventListener('click', () => window.location.href = '/auth/connect');

    const btnDisconnect = $('#btn-disconnect');
    if (btnDisconnect) btnDisconnect.addEventListener('click', () => window.location.href = '/auth/disconnect');

    const btnBuscarDados = $('#btn-buscar-dados');
    if (btnBuscarDados) btnBuscarDados.addEventListener('click', fetchAndRender);

    const filterEntity = $('#filter-entity');
    if (filterEntity) filterEntity.addEventListener('change', updateVisibleFilters);

    const financeSubtype = $('#finance-subtype');
    if (financeSubtype) financeSubtype.addEventListener('change', updateVisibleFilters);

    const btnMostrarHistorico = $('#btn-mostrar-historico');
    if (btnMostrarHistorico) {
        btnMostrarHistorico.addEventListener('click', async () => {
            const historyModal = new bootstrap.Modal($('#history-modal'));
            const modalBody = $('#history-modal-body');
            modalBody.innerHTML = '<p>Carregando...</p>';
            historyModal.show();
            try {
                const res = await fetch('/api/historico');
                const json = await res.json();
                if (!json.ok) throw new Error(json.error || 'Falha ao carregar histórico.');
                let historyHtml = '';
                for (const [category, files] of Object.entries(json.list)) {
                    if (files.length === 0) continue;
                    const fileItems = files.map(file => `
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white">
                            <a href="#" class="text-white btn-view-history" data-type="${category}" data-filename="${file}">${file}</a>
                            <button class="btn btn-sm btn-outline-danger btn-delete-history" data-type="${category}" data-filename="${file}">Excluir</button>
                        </li>`).join('');
                    historyHtml += `<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${category}">${category} (${files.length})</button></h2><div id="collapse-${category}" class="accordion-collapse collapse"><ul class="list-group list-group-flush">${fileItems}</ul></div></div>`;
                }
                modalBody.innerHTML = `<div class="accordion accordion-flush">${historyHtml || '<p>Nenhum arquivo.</p>'}</div>`;
            } catch (error) {
                modalBody.innerHTML = `<p class="text-danger">${error.message}</p>`;
            }
        });
    }

    // --- DELEGAÇÃO DE EVENTOS GERAL (SEMPRE SEGURO) ---
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        // O closest() garante que o clique funcione mesmo se for no ícone dentro do botão
        const printButton = target.closest('.btn-print');
        const editButton = target.closest('.btn-edit');
        const viewHistoryButton = target.closest('.btn-view-history');
        const deleteHistoryButton = target.closest('.btn-delete-history');

        if (viewHistoryButton) {
            e.preventDefault();
            const { type, filename } = viewHistoryButton.dataset;
            bootstrap.Modal.getInstance($('#history-modal')).hide();
            try {
                const res = await fetch(`/api/historico/${type}/${filename}`);
                const json = await res.json();
                if (!json.ok) throw new Error(json.error);
                const handler = window.appHandlers[type];
                const data = json.data.itens || (Array.isArray(json.data) ? json.data : []);
                const { formattedData, columnsConfig } = handler.format(data);
                initializeDataTable(formattedData, columnsConfig);
                $('#data-container').style.display = 'block';
                $('#output').innerHTML = `<div class="alert alert-info">Exibindo histórico: ${filename}</div>`;
            } catch (error) { alert(`Erro: ${error.message}`); }
        } else if (deleteHistoryButton) {
            const { type, filename } = deleteHistoryButton.dataset;
            if (confirm(`Excluir o arquivo ${filename}?`)) {
                try {
                    const res = await fetch(`/api/historico/${type}/${filename}`, { method: 'DELETE' });
                    const json = await res.json();
                    if (json.ok) deleteHistoryButton.closest('li').remove();
                    else throw new Error(json.error);
                } catch (error) { alert(`Erro: ${error.message}`); }
            }
        } else if (printButton || editButton) {
            const button = printButton || editButton;
            const { id, type, entity } = button.dataset;
            const isEdit = button.classList.contains('btn-edit');

            if (entity === 'vendas') {
                const data = window.rawApiData[id];
                if (!data) return alert('Dados da venda não encontrados.');
                isEdit ? showEditModal(data, type) : showPrintModal(data, type);
            } else if (entity === 'pessoas') {
                button.disabled = true;
                button.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
                try {
                    const res = await fetch(`/api/vendas/cliente/${id}`);
                    const json = await res.json();
                    if (!json.ok) throw new Error(json.error);
                    isEdit ? showEditModal(json.data, type) : showPrintModal(json.data, type);
                } catch (error) {
                    alert(`Erro ao buscar venda: ${error.message}`);
                } finally {
                    button.disabled = false;
                    const originalText = isEdit ? (type === 'condicional' ? 'Editar Cond.' : 'Editar Promis.') : (type === 'condicional' ? 'Condicional' : 'Promissória');
                    button.innerHTML = originalText;
                }
            }
        }
    });

    // --- FUNÇÕES E LISTENERS DE EXPORTAÇÃO (COM VERIFICAÇÃO) ---
    const btnExportPdf = $('#btn-export-pdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            if (!window.currentExportData || window.currentExportData.length === 0) return alert('Não há dados para exportar.');
            const exportData = getExportData();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape' });
            const headers = Object.keys(exportData[0]);
            const body = exportData.map(row => headers.map(header => row[header]));
            doc.autoTable({ head: [headers], body: body, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 23, 36] } });
            doc.save(`relatorio_${$('#filter-entity').value}.pdf`);
        });
    }

    const btnExportExcel = $('#btn-export-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            if (!window.currentExportData || window.currentExportData.length === 0) return alert('Não há dados para exportar.');
            const exportData = getExportData();
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
            XLSX.writeFile(workbook, `relatorio_${$('#filter-entity').value}.xlsx`);
        });
    }

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

    // --- INICIALIZAÇÃO ---
    // Inicializa os modais apenas se os elementos existirem na página
    const printModalEl = $('#print-modal');
    if (printModalEl) printModalInstance = new bootstrap.Modal(printModalEl);

    const editModalEl = $('#edit-modal');
    if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);

    // Atualiza os filtros se o seletor de entidade existir
    if ($('#filter-entity')) {
        updateVisibleFilters();
    }
});