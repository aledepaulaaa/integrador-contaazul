// ARQUIVO: /public/js/main.js

let printModalInstance = null;
let editModalInstance = null; // Instância para o modal de configurações globais
window.rawApiData = {}; // Armazena os dados brutos da API para uso

document.addEventListener('DOMContentLoaded', () => {
    const $ = (s) => document.querySelector(s);
    let dataTableInstance = null;
    window.currentExportData = [];

    // Mapeamento dos manipuladores de cada entidade
    window.appHandlers = {
        vendas: vendasHandler,
        pessoas: pessoasHandler,
        produtos: produtosHandler,
        notas: notasFiscaisHandler,
        baixas: financeirosHandlers.baixas,
        cobrancas: financeirosHandlers.cobrancas,
        centro_de_custos: financeirosHandlers.centro_de_custos
    };

    // --- FUNÇÕES DE UI (FILTROS) ---
    function updateVisibleFilters() {
        const entity = $('#filter-entity')?.value;
        const financeSubtype = $('#finance-subtype')?.value;

        // Esconde todos primeiro
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

        // Configura parâmetros baseado nos filtros
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

                // Formata os dados (aqui os botões de ação são criados nas entidades vendas/pessoas)
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
            data,
            columns: columnsConfig,
            responsive: true,
            destroy: true,
            language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/pt-BR.json' },
            columnDefs: [
                // Desabilita ordenação na última coluna (assumindo que seja 'Ações')
                { orderable: false, targets: -1 }
            ]
        });
    }

    // --- LÓGICA DE CONFIGURAÇÃO GLOBAL (PERSISTÊNCIA JSON) ---

    // Abre o modal para cadastrar ou atualizar as configs fixas
    async function openGlobalSettingsModal() {
        $('#edit-modal-title').textContent = 'Configurações Globais de Impressão';
        const saveBtn = $('#btn-save-and-print');
        saveBtn.textContent = 'Salvar Alterações'; // Renomeia o botão para refletir a ação

        // 1. Tenta buscar configurações existentes
        try {
            const res = await fetch('/api/settings/print');
            const json = await res.json();
            const settings = json.data || {};

            // 2. Preenche os campos do modal
            $('#edit-header').value = settings.header || 'METTA CONTABILIDADE/STA BARBARA DO LESTE';
            $('#edit-footer').value = settings.footer || `Reconheço que as mercadorias acima descritas\nestão sob minha responsabilidade...`;
            $('#edit-prazo').value = settings.prazo || '';
            $('#edit-modalidade').value = settings.modalidade || '';
            $('#edit-vencimento').value = settings.vencimento || '';

            // Garante que os campos extras apareçam
            $('#condicional-fields').style.display = 'block';

            // 3. Define a ação de salvar
            saveBtn.onclick = async () => {
                const newSettings = {
                    header: $('#edit-header').value,
                    footer: $('#edit-footer').value,
                    prazo: $('#edit-prazo').value,
                    modalidade: $('#edit-modalidade').value,
                    vencimento: $('#edit-vencimento').value
                };

                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

                try {
                    const saveRes = await fetch('/api/settings/print', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newSettings)
                    });
                    const saveJson = await saveRes.json();

                    if (saveJson.ok) {
                        alert('Configurações salvas com sucesso!');
                        editModalInstance.hide();
                    } else {
                        alert('Erro ao salvar: ' + saveJson.error);
                    }
                } catch (e) {
                    alert('Erro de conexão ao salvar.');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Salvar Alterações';
                }
            };

            editModalInstance.show();

        } catch (error) {
            alert('Erro ao carregar configurações: ' + error.message);
        }
    }

    // Apaga as configurações salvas
    async function deleteGlobalSettings() {
        if (confirm('Tem certeza que deseja APAGAR as configurações salvas? Isso retornará aos valores padrão na próxima impressão.')) {
            if (confirm('Confirmar exclusão definitiva?')) {
                try {
                    const res = await fetch('/api/settings/print', { method: 'DELETE' });
                    const json = await res.json();
                    if (json.ok) alert('Configurações apagadas.');
                    else alert('Erro ao apagar: ' + json.error);
                } catch (e) {
                    alert('Erro ao conectar.');
                }
            }
        }
    }

    // --- LÓGICA DE IMPRESSÃO (INTEGRADA COM CONFIG GLOBAL) ---

    // Prepara os dados e o layout
    async function prepareAndShowPrintModal(dataId, printType, entityType) {
        // 1. Busca dados da entidade (Venda ou Pessoa)
        let dataToPrint = null;

        if (entityType === 'vendas') {
            dataToPrint = window.rawApiData[dataId];
        } else if (entityType === 'pessoas') {
            // Busca dados detalhados da pessoa/venda se necessário
            const btn = document.querySelector(`.btn-print-row[data-id="${dataId}"]`);
            if (btn) {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                btn.disabled = true;

                try {
                    const res = await fetch(`/api/vendas/cliente/${dataId}`);
                    const json = await res.json();
                    if (json.ok) dataToPrint = json.data;
                    else throw new Error(json.error);
                } catch (e) {
                    alert('Erro ao buscar dados para impressão: ' + e.message);
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    return;
                }
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }

        if (!dataToPrint) return alert('Dados não encontrados para impressão.');

        // 2. Busca Configurações Globais (Settings)
        let globalSettings = {};
        try {
            const res = await fetch('/api/settings/print');
            const json = await res.json();
            if (json.ok && json.data) {
                globalSettings = json.data;
            }
        } catch (e) {
            console.warn('Usando configurações padrão (falha ao carregar globais).');
        }

        // 3. Gera HTML baseado no tipo (Promissória ou Condicional)
        let htmlContent = '';
        if (printType === 'condicional') {
            $('#print-modal-title').textContent = 'Impressão Condicional';
            htmlContent = PrintHandler.generateCondicionalHTML(dataToPrint, globalSettings);
        } else {
            $('#print-modal-title').textContent = 'Impressão Promissória';
            htmlContent = PrintHandler.generatePromissoriaHTML(dataToPrint, globalSettings);
        }

        // 4. Exibe o Modal de Pré-visualização
        $('#print-modal-body').innerHTML = htmlContent;
        $('#btn-confirm-print').onclick = () => handlePrinting(htmlContent);
        printModalInstance.show();
    }

    // Abre a janela de impressão com CSS corrigido
    function handlePrinting(content) {
        const printWindow = window.open('', '_blank');
        const style = `
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 15px; /* Tamanho da fonte aumentado */
                    font-weight: bold; /* Negrito para melhor legibilidade térmica */
                    margin: 0; 
                    color: #000;
                }
                .print-preview { 
                    margin: 0; 
                    white-space: pre-wrap; 
                    line-height: 1.2; 
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    @page { margin: 0; }
                }
            </style>
        `;
        printWindow.document.write(`<html><head><title>Imprimir</title>${style}</head><body>${content}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }

    // --- EVENT LISTENERS (BOTÕES E INTERAÇÕES) ---

    // Botões de Configuração Global
    const btnConfig = $('#btn-config-settings');
    if (btnConfig) btnConfig.addEventListener('click', openGlobalSettingsModal);

    const btnDelConfig = $('#btn-delete-settings');
    if (btnDelConfig) btnDelConfig.addEventListener('click', deleteGlobalSettings);

    // Botões Padrão (Auth, Busca, Filtros)
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

    // DELEGAÇÃO DE EVENTOS (TABELA E LISTAS DINÂMICAS)
    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        // Verifica cliques nos novos botões de impressão dentro da tabela
        const printButtonRow = target.closest('.btn-print-row');

        // Verifica botões do histórico
        const viewHistoryButton = target.closest('.btn-view-history');
        const deleteHistoryButton = target.closest('.btn-delete-history');

        // 1. Ação de Imprimir (Vindo da tabela)
        if (printButtonRow) {
            const { id, type, entity } = printButtonRow.dataset; // type: 'condicional' ou 'promissoria'
            await prepareAndShowPrintModal(id, type, entity);
        }

        // 2. Ação de Ver Histórico
        else if (viewHistoryButton) {
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
        }

        // 3. Ação de Excluir Histórico
        else if (deleteHistoryButton) {
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

    // --- EXPORTAÇÃO (PDF/EXCEL) ---
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

    // Limpa HTML de botões/accordions para exportação limpa
    function getExportData() {
        return window.currentExportData.map(row => {
            const cleanRow = { ...row };
            for (const key in cleanRow) {
                // Remove botões de ação da exportação
                if (key === 'Ações') {
                    delete cleanRow[key];
                    continue;
                }
                // Limpa HTML (como accordions)
                if (typeof cleanRow[key] === 'string' && cleanRow[key].includes('<')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = cleanRow[key];
                    cleanRow[key] = (tempDiv.querySelector('button')?.textContent || tempDiv.textContent || '').trim();
                }
            }
            return cleanRow;
        });
    }

    // --- INICIALIZAÇÃO DE MODAIS ---
    const printModalEl = $('#print-modal');
    if (printModalEl) printModalInstance = new bootstrap.Modal(printModalEl);

    const editModalEl = $('#edit-modal');
    if (editModalEl) editModalInstance = new bootstrap.Modal(editModalEl);

    // Estado inicial dos filtros
    if ($('#filter-entity')) {
        updateVisibleFilters();
    }
});