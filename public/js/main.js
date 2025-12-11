// ARQUIVO: /public/js/main.js

let printModalInstance = null;
let editModalInstance = null;
window.rawApiData = {};

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

    // --- FUNÇÕES DE UI ---
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

                // Armazena dados brutos e formata
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
            language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json' },
            columnDefs: [{ orderable: false, targets: -1 }]
        });
    }

    // --- LÓGICA DE CONFIGURAÇÃO (SEPARADA POR TIPO) ---

    async function openSettingsModal(type) {
        const isCondicional = type === 'condicional';
        const title = isCondicional ? 'Cadastro Condicional' : 'Cadastro Promissória';

        $('#edit-modal-title').textContent = title;
        $('#edit-modal-title').innerHTML = `<i class="bi bi-gear"></i> ${title}`;

        const saveBtn = $('#btn-save-and-print');
        saveBtn.textContent = 'Salvar Alterações';

        $('#condicional-fields').style.display = isCondicional ? 'block' : 'none';

        const formInputs = document.querySelectorAll('#edit-form input, #edit-form textarea');
        formInputs.forEach(input => input.disabled = true);

        try {
            const res = await fetch('/api/settings/print');
            const json = await res.json();

            const allSettings = json.data || {};
            const currentSettings = allSettings[type] || {};

            $('#edit-header').value = currentSettings.header || (isCondicional
                ? 'METTA CONTABILIDADE/STA BARBARA DO LESTE'
                : 'METTA CONTABILIDADE\nCNPJ...\nSTA BARBARA DO LESTE/MG');

            $('#edit-footer').value = currentSettings.footer || (isCondicional
                ? 'Reconheço que as mercadorias acima descritas estão sob minha responsabilidade...'
                : 'Reconheço (emos) a exatidão desta duplicata...');

            if (isCondicional) {
                $('#edit-prazo').value = currentSettings.prazo || '';
                $('#edit-modalidade').value = currentSettings.modalidade || '';
                $('#edit-vencimento').value = currentSettings.vencimento || '';
            }

            formInputs.forEach(input => input.disabled = false);

            saveBtn.onclick = async () => {
                const newSettings = {
                    header: $('#edit-header').value,
                    footer: $('#edit-footer').value
                };

                if (isCondicional) {
                    newSettings.prazo = $('#edit-prazo').value;
                    newSettings.modalidade = $('#edit-modalidade').value;
                    newSettings.vencimento = $('#edit-vencimento').value;
                }

                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

                try {
                    const saveRes = await fetch('/api/settings/print', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: type, settings: newSettings })
                    });
                    const saveJson = await saveRes.json();

                    if (saveJson.ok) {
                        alert(`Configurações de ${isCondicional ? 'Condicional' : 'Promissória'} salvas!`);
                        editModalInstance.hide();
                    } else {
                        alert('Erro ao salvar: ' + saveJson.error);
                    }
                } catch (e) {
                    alert('Erro de conexão.');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Salvar Alterações';
                }
            };

            editModalInstance.show();

        } catch (error) {
            alert('Erro ao carregar configurações: ' + error.message);
            formInputs.forEach(input => input.disabled = false);
        }
    }

    async function deleteAllSettings() {
        if (confirm('Tem certeza? Isso apagará as configurações de AMBOS (Condicional e Promissória).')) {
            try {
                const res = await fetch('/api/settings/print', { method: 'DELETE' });
                const json = await res.json();
                if (json.ok) alert('Todas as configurações foram redefinidas.');
                else alert('Erro ao apagar.');
            } catch (e) { alert('Erro de conexão.'); }
        }
    }

    // --- LÓGICA DE IMPRESSÃO (CORRIGIDA - SEM FETCH EXTRA) ---

    async function prepareAndShowPrintModal(dataId, printType, entityType) {
        let dataToPrint = null;

        // Feedback visual no botão
        const btn = document.querySelector(`.btn-print-row[data-id="${dataId}"][data-type="${printType}"]`);
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        }

        try {
            if (entityType === 'vendas') {
                // Busca Detalhada Obrigatória
                try {
                    console.log('Solicitando detalhes da venda ID:', dataId);
                    const res = await fetch(`/api/vendas/${dataId}`);

                    if (!res.ok) throw new Error(`Erro API: ${res.status}`);

                    const json = await res.json();

                    if (json.ok && json.data) {
                        dataToPrint = json.data;
                        // Validação extra: se itens vier vazio, tenta usar o resumo
                        if (!dataToPrint.itens && window.rawApiData[dataId]) {
                            console.warn('Itens vazios no detalhe, tentando mesclar com resumo.');
                            dataToPrint = { ...window.rawApiData[dataId], ...dataToPrint };
                        }
                    } else {
                        throw new Error(json.error || 'Dados inválidos');
                    }
                } catch (err) {
                    console.error('Falha no fetch detalhado:', err);
                    throw new Error('Não foi possível carregar os produtos da venda. Tente novamente.');
                }
            } else if (entityType === 'pessoas') {
                const res = await fetch(`/api/vendas/cliente/${dataId}`);
                const json = await res.json();
                if (json.ok) dataToPrint = json.data;
            }

            if (!dataToPrint) throw new Error('Dados não encontrados.');

            // Busca configurações
            let configToUse = {};
            try {
                const resSettings = await fetch('/api/settings/print');
                const jsonSettings = await resSettings.json();
                if (jsonSettings.ok && jsonSettings.data) {
                    configToUse = jsonSettings.data[printType] || {};
                }
            } catch (e) { }

            // Gera HTML
            let htmlContent = '';
            if (printType === 'condicional') {
                $('#print-modal-title').textContent = 'Impressão Condicional';
                htmlContent = PrintHandler.generateCondicionalHTML(dataToPrint, configToUse);
            } else {
                $('#print-modal-title').textContent = 'Impressão Promissória';
                htmlContent = PrintHandler.generatePromissoriaHTML(dataToPrint, configToUse);
            }

            $('#print-modal-body').innerHTML = htmlContent;
            $('#btn-confirm-print').onclick = () => handlePrinting(htmlContent);
            printModalInstance.show();

        } catch (e) {
            alert('Erro: ' + e.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        }
    }


    function handlePrinting(content) {
        const printWindow = window.open('', '_blank');
        const style = `
            <style>
                body { 
                    font-family: 'Courier New', monospace; /* Fonte monoespaçada obrigatória para alinhar colunas */
                    font-size: 17px; /* Tamanho solicitado */
                    font-weight: bold;
                    margin: 0; 
                    padding: 5px;
                    color: #000;
                    background-color: #fff;
                }
                
                .print-preview { 
                    margin: 0; 
                    white-space: pre-wrap; 
                    line-height: 1.1; /* Espaçamento ligeiramente menor para economizar papel */
                    text-align: left; 
                    width: 100%;
                }

                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    @page { margin: 0; size: auto; }
                }
            </style>
        `;
        printWindow.document.write(`<html><head><title>Imprimir</title>${style}</head><body>${content}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }

    // --- LISTENERS ---

    // Configurações Globais
    const btnCond = $('#btn-config-condicional');
    if (btnCond) btnCond.addEventListener('click', () => openSettingsModal('condicional'));

    const btnProm = $('#btn-config-promissoria');
    if (btnProm) btnProm.addEventListener('click', () => openSettingsModal('promissoria'));

    // Botão de Deletar Configurações
    const btnDel = $('#btn-delete-settings');
    if (btnDel) btnDel.addEventListener('click', deleteAllSettings);

    // Botões Padrão
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

    // Botão Histórico
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

    // Delegação de Eventos
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        const printButtonRow = target.closest('.btn-print-row');
        const viewHistoryButton = target.closest('.btn-view-history');
        const deleteHistoryButton = target.closest('.btn-delete-history');

        if (printButtonRow) {
            const { id, type, entity } = printButtonRow.dataset;
            await prepareAndShowPrintModal(id, type, entity);
        } else if (viewHistoryButton) {
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
        }
    });

    // Exportação
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
                if (key === 'Ações') { delete cleanRow[key]; continue; }
                if (typeof cleanRow[key] === 'string' && cleanRow[key].includes('<')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cleanRow[key];
                    cleanRow[key] = (tempDiv.querySelector('button')?.textContent || tempDiv.textContent || '').trim();
                }
            }
            return cleanRow;
        });
    }

    // Inicialização
    const printModalEl = $('#print-modal');
    if (printModalEl) printModalInstance = new bootstrap.Modal(printModalEl);
    const editModalEl = $('#edit-modal');
    if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);
    if ($('#filter-entity')) updateVisibleFilters();
});