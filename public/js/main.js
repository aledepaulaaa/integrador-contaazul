// ARQUIVO: /public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // Helper para selecionar elementos
    const $ = (s) => document.querySelector(s);

    // Objeto global para armazenar os "handlers" (módulos de formatação)
    window.appHandlers = {};
    // Armazena a instância do DataTables para ser gerenciada
    let dataTableInstance = null;
    // Armazena os dados formatados para uso nas funções de exportação
    window.currentExportData = [];

    // --- FUNÇÕES DE UI (CONTROLE DE VISIBILIDADE DOS FILTROS) ---

    /**
     * Controla quais filtros são exibidos na tela com base na seleção da entidade.
     */
    function updateVisibleFilters() {
        const entity = $('#filter-entity').value;
        const financeSubtype = $('#finance-subtype').value;

        // Esconde todos os containers de filtros dinâmicos
        document.querySelectorAll('#dynamic-filters-container .filter-control').forEach(el => el.style.display = 'none');

        if (entity === 'financeiro') {
            $('#finance-subtype-wrapper').style.display = 'flex';
            if (financeSubtype === 'centro_de_custos') {
                $('#cost-center-status-wrapper').style.display = 'flex';
                $('#cost-center-search-wrapper').style.display = 'flex';
            } else { // Baixas ou Cobranças por ID
                $('#finance-id-wrapper').style.display = 'flex';
            }
        } else if (entity === 'vendas' || entity === 'notas') {
            $('#date-filters').style.display = 'flex';
            $('#date-filters-end').style.display = 'flex';
        }
        // Para Pessoas e Produtos, nenhum filtro extra é exibido por padrão.
    }

    // --- LÓGICA DE BUSCA DE DADOS ---

    /**
     * Função principal que constrói a requisição, busca os dados e os renderiza.
     */
    async function fetchAndRender() {
        let entityValue = $('#filter-entity').value;
        const outputDiv = $('#output');
        const dataContainer = $('#data-container');
        let apiPath = '';
        const params = new URLSearchParams();
        let method = 'GET';

        // 1. CONSTRUIR A ROTA E OS PARÂMETROS
        if (entityValue === 'financeiro') {
            entityValue = $('#finance-subtype').value;
            const financeId = $('#finance-id-filter').value.trim();
            if (entityValue === 'centro_de_custos') {
                apiPath = `/api/centro_de_custos`;
                params.append('busca', $('#cost-center-search').value);
                params.append('status', $('#cost-center-status').value);
            } else { // Baixas ou Cobranças por ID
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
            if (entityValue === 'pessoas') {
                method = 'POST';
            }
        }

        outputDiv.innerHTML = '<p class="text-center">Buscando dados...</p>';
        dataContainer.style.display = 'none';

        // 2. FAZER A REQUISIÇÃO
        try {
            const fullUrl = `${apiPath}?${params.toString()}`;
            const res = await fetch(fullUrl, { method: 'GET' });
            const json = await res.json();

            if (json.ok) {
                // 3. ROTEAMENTO, FORMATAÇÃO E RENDERIZAÇÃO
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

    // --- EVENT LISTENERS ---

    $('#btn-auth').addEventListener('click', () => window.location.href = '/auth/connect');
    $('#btn-disconnect').addEventListener('click', () => window.location.href = '/auth/disconnect');
    $('#btn-buscar-dados').addEventListener('click', fetchAndRender);

    // Listeners que controlam a UI dinâmica de filtros
    $('#filter-entity').addEventListener('change', updateVisibleFilters);
    $('#finance-subtype').addEventListener('change', updateVisibleFilters);

    // Listener para o Histórico
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
                        <span>${file.replace('.json', '')}</span>
                        <button class="btn btn-sm btn-outline-danger btn-delete-history" data-type="${category}" data-filename="${file}">Excluir</button>
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

    // Listener para deleção de arquivos do histórico (usando delegação de evento)
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete-history')) {
            const button = e.target;
            const { type, filename } = button.dataset;
            if (confirm(`Tem certeza que deseja excluir o arquivo ${filename} da categoria ${type}?`)) {
                try {
                    const res = await fetch(`/api/historico/${type}/${filename}`, { method: 'DELETE' });
                    const json = await res.json();
                    if (json.ok) button.closest('li').remove();
                    else throw new Error(json.error || 'Erro ao excluir arquivo.');
                } catch (error) {
                    alert(error.message);
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
    // Garante que os filtros corretos sejam exibidos ao carregar a página
    updateVisibleFilters();
});